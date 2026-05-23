import { NextResponse } from 'next/server';

/**
 * Posts credentials to the NestJS backend and sets a session cookie with the
 * returned admin JWT. Called via `fetch` from the login form client component
 * so we can surface errors inline instead of redirecting.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const email = form.get('email');
  const password = form.get('password');

  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5001';
  try {
    const res = await fetch(`${base}/auth/admin/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
    }
    const { token } = (await res.json()) as { token: string; email?: string };
    const response = NextResponse.json({ ok: true });
    const secure = (process.env.NODE_ENV === 'production');
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
  } catch {
    return NextResponse.json({ error: 'backend_unreachable' }, { status: 502 });
  }
}
