import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 관리자 경로 보호
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // 클라이언트 사이드에서 처리하도록 통과
    // 실제 보호는 AdminGuard 컴포넌트에서 수행
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};