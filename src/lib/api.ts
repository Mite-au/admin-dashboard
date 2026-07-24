import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Tiny fetch wrapper for talking to the Mite NestJS backend.
 * Runs server-side (RSC or route handlers) and forwards the per-user
 * `admin_token` cookie as a bearer token. If the backend rejects the token
 * (401), we redirect to /login so the user can re-authenticate.
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

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

export async function api<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;

  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  if (token) headers.set('authorization', `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers,
      cache: 'no-store',
    });
  } catch (cause) {
    // Refused connection, DNS failure, TLS error, timeout — the backend is
    // unreachable from the server runtime (a misconfigured
    // NEXT_PUBLIC_API_BASE_URL on Vercel lands here). Convert it to an
    // ApiError so the error boundary can name the cause.
    const reason = cause instanceof Error ? cause.message : String(cause);
    throw new ApiError(503, `Backend unreachable at ${BASE_URL}${path} — ${reason}`);
  }

  if (res.status === 401) {
    // Token missing/expired — bounce back to login. Middleware won't catch
    // this case because the cookie is present but the JWT is stale.
    redirect('/login');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text || res.statusText);
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
