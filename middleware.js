import { NextResponse } from 'next/server';

export function middleware(req) {
  const token = req.cookies.get('pd_token')?.value;
  const { pathname } = req.nextUrl;
  if (pathname === '/login') return NextResponse.next();
  if (!token) return NextResponse.redirect(new URL('/login', req.url));
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next|favicon.ico).*)'] };
