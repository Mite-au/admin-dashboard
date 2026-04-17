import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Gates every admin route behind a valid `admin_token` cookie. If missing,
 * bounce to /login. Actual JWT validity is checked later when api() hits the
 * backend — a stale token will 401 there and trigger a redirect.
 */
export function middleware(req: NextRequest) {
  const hasToken = Boolean(req.cookies.get('admin_token')?.value);
  if (hasToken) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  // Run on everything except the login page, login/logout routes, and Next
  // asset pipeline. Anything else requires auth.
  matcher: ['/((?!login|api/login|api/logout|_next/static|_next/image|favicon.ico).*)'],
};
