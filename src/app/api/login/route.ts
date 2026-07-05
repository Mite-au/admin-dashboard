import { NextResponse } from 'next/server';

/**
 * Posts credentials to the NestJS backend and, on success, mints a first-party
 * httpOnly session cookie holding the returned admin JWT.
 *
 * Architecture note: the backend returns the JWT in the JSON body (`{ token }`),
 * NOT via `Set-Cookie`. This route mints its own cookie on the admin-dashboard
 * origin, so the backend's cookie domain / SameSite / Secure settings are
 * irrelevant to where this app runs (localhost, alpha, prod). Called via
 * `fetch` from the login form client component so errors surface inline instead
 * of redirecting.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const email = form.get('email');
  const password = form.get('password');

  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5001';
  const target = `${base}/auth/admin/login`;

  let res: Response;
  try {
    res = await fetch(target, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch (err) {
    // Network-level failure (DNS / TLS / connection refused / timeout). This is
    // NOT a credentials problem — keep it distinct from a 401 so an operator can
    // tell "backend is down" apart from "wrong password". Never log `password`.
    console.error(
      `[api/login] backend unreachable at ${target}:`,
      err instanceof Error ? err.message : String(err),
    );
    return NextResponse.json({ error: 'backend_unreachable' }, { status: 502 });
  }

  if (!res.ok) {
    // Preserve the backend's own status instead of flattening everything to 401,
    // so a genuine bad-credentials 401/403 is not confused with a 5xx backend
    // bug. Log a short body snippet server-side for diagnosis; the response body
    // never contains the submitted password.
    const detail = await res.text().catch(() => '');
    console.error(
      `[api/login] backend rejected login: ${res.status} ${res.statusText} — ${detail.slice(0, 300)}`,
    );
    const isAuthFailure = res.status === 401 || res.status === 403;
    // Surface upstream 5xx as a 502 (bad gateway); pass client-error codes
    // through unchanged so the real reason is preserved end to end.
    const status = res.status >= 500 ? 502 : res.status;
    return NextResponse.json(
      { error: isAuthFailure ? 'invalid_credentials' : 'backend_error', upstreamStatus: res.status },
      { status },
    );
  }

  let token: string | undefined;
  try {
    ({ token } = (await res.json()) as { token?: string; email?: string });
  } catch {
    token = undefined;
  }
  if (!token) {
    // Backend returned 2xx but no token — treat as an upstream contract failure
    // rather than silently setting an empty session cookie.
    console.error('[api/login] backend returned 2xx but no `token` in body');
    return NextResponse.json({ error: 'no_token' }, { status: 502 });
  }

  const response = NextResponse.json({ ok: true });
  const secure = process.env.NODE_ENV === 'production';
  // 30 days. Note: the backend JWT has its own expiry — once that lapses,
  // api() will 401 and bounce to /login regardless of this cookie's age.
  const maxAge = 60 * 60 * 24 * 30;
  response.cookies.set('admin_token', token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
  // Non-httpOnly cookie used only for displaying the email in the topbar.
  response.cookies.set('admin_email', String(email ?? ''), {
    httpOnly: false,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
  return response;
}
