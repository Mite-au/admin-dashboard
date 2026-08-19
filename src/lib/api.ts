import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Tiny fetch wrapper for talking to the Mite NestJS backend.
 * Runs server-side (RSC or route handlers) and forwards the per-user
 * `admin_token` cookie as a bearer token. If the backend rejects the token
 * (401), we redirect to /login so the user can re-authenticate.
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

/**
 * Per-request ceiling. RSC pages fan out ~8 fetches in a `Promise.all`, so a
 * single endpoint hanging on a stuck DB connection would otherwise hold the
 * whole page open until the platform's own (much longer) limit kills it with
 * no useful diagnostic. 12s is well past the p99 of a healthy admin query.
 */
const REQUEST_TIMEOUT_MS = 12_000;

/** Pause before the single retry. Long enough to clear a blip, short enough
 *  not to be felt on top of an already-slow request. */
const RETRY_BACKOFF_MS = 250;

/** Transient upstream statuses: a proxy or restarting pod, not a real answer. */
const RETRYABLE_STATUSES = new Set([502, 503, 504]);

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * `redirect()` works by throwing. Any `catch` around a fetcher has to let that
 * throw through, otherwise the auth bounce is swallowed and the page renders
 * a half-empty shell instead of sending the user to /login.
 */
export function isRedirectError(err: unknown): boolean {
  const digest = (err as { digest?: unknown } | null)?.digest;
  return typeof digest === 'string' && digest.startsWith('NEXT_REDIRECT');
}

/**
 * Combine the timeout signal with a caller-supplied one.
 *
 * Deliberately not `AbortSignal.any()` — that landed in Node 20.3, and this
 * bundle still has to run wherever the deploy target pins Node. The listener
 * is torn down by the caller's `cleanup` so a long-lived caller signal
 * doesn't accumulate handlers across requests.
 */
function mergeSignals(
  timeout: AbortSignal,
  caller: AbortSignal | null | undefined,
): { signal: AbortSignal; cleanup: () => void } {
  if (!caller) return { signal: timeout, cleanup: () => {} };
  if (caller.aborted) return { signal: caller, cleanup: () => {} };

  const controller = new AbortController();
  const abort = () => controller.abort();
  timeout.addEventListener('abort', abort, { once: true });
  caller.addEventListener('abort', abort, { once: true });

  return {
    signal: controller.signal,
    cleanup: () => {
      timeout.removeEventListener('abort', abort);
      caller.removeEventListener('abort', abort);
    },
  };
}

/**
 * Pull a human message out of a NestJS error body.
 *
 * Nest serialises failures as `{ statusCode, message, error }`, where
 * `message` is a string for thrown `HttpException`s and a string[] for
 * `ValidationPipe` failures. Surfacing the raw JSON puts
 * `{"statusCode":400,"message":["status must be..."]}` in the user's toast;
 * this extracts the sentence a human can act on and falls back to the raw
 * text when the body is something else entirely (an HTML error page, a
 * plain-text proxy message).
 */
function extractErrorMessage(body: string, fallback: string): string {
  const text = body.trim();
  if (!text) return fallback;

  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed === 'string') return parsed || fallback;
    if (parsed && typeof parsed === 'object') {
      const record = parsed as Record<string, unknown>;
      const message = record.message;
      if (typeof message === 'string' && message.trim()) return message;
      if (Array.isArray(message)) {
        const joined = message.filter((m) => typeof m === 'string' && m.trim()).join('; ');
        if (joined) return joined;
      }
      if (typeof record.error === 'string' && record.error.trim()) return record.error;
    }
  } catch {
    // Not JSON — fall through to the raw text below.
  }

  // Cap it: an HTML error page would otherwise dump a whole document into a
  // toast or an error-boundary heading.
  return text.slice(0, 300);
}

/** GET/HEAD are the only methods safe to replay — a retried POST double-books. */
function isIdempotent(method: string | undefined): boolean {
  const verb = (method ?? 'GET').toUpperCase();
  return verb === 'GET' || verb === 'HEAD';
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Issue the request, replaying once on a transient failure.
 *
 * At most two attempts, and only for idempotent verbs. Mutations get exactly
 * one shot: replaying a PATCH that actually succeeded but lost its response
 * on the way back would silently apply the change twice.
 */
async function fetchWithRetry(path: string, init: RequestInit): Promise<Response> {
  const maxAttempts = isIdempotent(init.method) ? 2 : 1;
  const callerSignal = init.signal;

  for (let attempt = 1; ; attempt += 1) {
    const isLastAttempt = attempt >= maxAttempts;

    const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    const { signal, cleanup } = mergeSignals(timeoutSignal, callerSignal);

    let res: Response;
    try {
      res = await fetch(`${BASE_URL}${path}`, { ...init, cache: 'no-store', signal });
    } catch (cause) {
      cleanup();

      // The caller gave up (a navigation aborted the render) — that's not a
      // backend fault, so don't dress it up as one and don't retry it.
      if (callerSignal?.aborted) throw cause;

      if (timeoutSignal.aborted) {
        // Not retried: a second 12s wait doubles the page's worst case for a
        // backend that has already shown it can't answer in time.
        throw new ApiError(
          504,
          `Request to ${path} timed out after ${REQUEST_TIMEOUT_MS / 1000}s`,
        );
      }

      // Refused connection, DNS failure, TLS error — the backend is
      // unreachable from the server runtime (a misconfigured
      // NEXT_PUBLIC_API_BASE_URL on Vercel lands here). Convert it to an
      // ApiError so the error boundary can name the cause.
      if (!isLastAttempt) {
        await sleep(RETRY_BACKOFF_MS);
        continue;
      }
      const reason = cause instanceof Error ? cause.message : String(cause);
      throw new ApiError(503, `Backend unreachable at ${BASE_URL}${path} — ${reason}`);
    }

    cleanup();

    // A restarting pod or a proxy with no upstream. Worth one replay; a real
    // 4xx or a considered 500 is the backend's actual answer.
    if (RETRYABLE_STATUSES.has(res.status) && !isLastAttempt) {
      // Release the discarded body — undici holds the socket open until the
      // stream is consumed or cancelled, so skipping this leaks a connection
      // per retry.
      await res.body?.cancel().catch(() => {});
      await sleep(RETRY_BACKOFF_MS);
      continue;
    }
    return res;
  }
}

export async function api<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  if (token) headers.set('authorization', `Bearer ${token}`);

  const res = await fetchWithRetry(path, { ...init, headers });

  if (res.status === 401) {
    // Token missing/expired — bounce back to login. Middleware won't catch
    // this case because the cookie is present but the JWT is stale.
    redirect('/login');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, extractErrorMessage(text, res.statusText));
  }

  if (res.status === 204) return undefined as T;

  // A proxy or error page can return 200 with HTML. Parsing that as JSON blows
  // up mid-render, so fail with the status attached instead.
  const body = await res.text();
  if (!body) return undefined as T;
  try {
    return JSON.parse(body) as T;
  } catch {
    throw new ApiError(502, `Expected JSON from ${path}, got: ${body.slice(0, 200)}`);
  }
}
