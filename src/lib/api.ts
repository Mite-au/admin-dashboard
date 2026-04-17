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

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

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
  return res.json() as Promise<T>;
}
