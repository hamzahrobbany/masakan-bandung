import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_LOGIN_PATH,
  ADMIN_ROUTE_PREFIX,
  ADMIN_SESSION_COOKIE,
} from "@/lib/security";
import { verifySessionToken } from "@/lib/auth";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (!path.startsWith(ADMIN_ROUTE_PREFIX)) {
    return NextResponse.next();
  }

  if (path === ADMIN_LOGIN_PATH || path.startsWith(`${ADMIN_LOGIN_PATH}/`)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const session = token ? verifySessionToken(token) : null;

  if (!session) {
    const loginURL = new URL(ADMIN_LOGIN_PATH, req.url);
    loginURL.searchParams.set("redirect", path);

    const res = NextResponse.redirect(loginURL);
    res.cookies.delete(ADMIN_SESSION_COOKIE);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
  runtime: "nodejs",
};
