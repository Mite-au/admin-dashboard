import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL('/login', req.url), 303);
  res.cookies.delete('admin_token');
  res.cookies.delete('admin_email');
  return res;
}
