import { NextResponse } from 'next/server';

/**
 * Posts credentials to the NestJS backend and sets a session cookie with the
 * returned admin JWT. Adjust the endpoint and response shape once the backend
 * admin-auth endpoint is finalised.
 */
export async function POST(req: Request) {
  const form = await req.formData();
  const email = form.get('email');
  const password = form.get('password');

  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
  try {
    const res = await fetch(`${base}/auth/admin/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      return NextResponse.redirect(new URL('/login?error=1', req.url));
    }
    const { token } = (await res.json()) as { token: string };
    const response = NextResponse.redirect(new URL('/dashboard', req.url));
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8,
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL('/login?error=1', req.url));
  }
}
