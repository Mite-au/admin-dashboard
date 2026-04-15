/**
 * Tiny fetch wrapper for talking to the Mite NestJS backend.
 * All calls run server-side (RSC or route handlers) and forward the
 * ADMIN_API_TOKEN as a bearer token.
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
const TOKEN = process.env.ADMIN_API_TOKEN ?? '';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  if (TOKEN) headers.set('authorization', `Bearer ${TOKEN}`);

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(res.status, text || res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Wraps api() with a fallback so pages still render when the backend isn't reachable. */
export async function apiOr<T>(path: string, fallback: T, init?: RequestInit): Promise<T> {
  try {
    return await api<T>(path, init);
  } catch {
    return fallback;
  }
}
