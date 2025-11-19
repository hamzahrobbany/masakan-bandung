import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { ADMIN_LOGIN_PATH, ADMIN_ROUTE_PREFIX, ADMIN_SESSION_COOKIE } from '@/lib/security';

export default function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith(ADMIN_ROUTE_PREFIX)) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname === ADMIN_LOGIN_PATH) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  if (!hasSession) {
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
    const redirectTo = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    loginUrl.searchParams.set('redirect', redirectTo);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};
