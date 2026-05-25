// Design Ref: §6 — 보호 라우트: 쿠키 기반 (localStorage는 서버 접근 불가)
import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = ['/dashboard', '/bookmarks', '/search'];
const AUTH_ONLY = ['/login', '/register'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('sb-session')?.value;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthOnly = AUTH_ONLY.some((p) => pathname.startsWith(p));

  // Plan SC: 비로그인 + 보호 경로 → /login
  if (isProtected && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Plan SC: 인증됨 + 로그인/회원가입 페이지 → /dashboard
  if (isAuthOnly && token) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
