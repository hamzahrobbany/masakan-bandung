import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_LOGIN_PATH,
  ADMIN_ROUTE_PREFIX,
  ADMIN_SESSION_COOKIE,
} from "@/lib/security";
import { verifyJWT } from "@/lib/proxy";

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Hanya proteksi /admin
  if (!path.startsWith(ADMIN_ROUTE_PREFIX)) {
    return NextResponse.next();
  }

  // Bebaskan login
  if (path.startsWith(ADMIN_LOGIN_PATH)) {
    return NextResponse.next();
  }

  // Ambil cookie
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const check = verifyJWT(token);

  if (!check.valid) {
    console.log("JWT invalid:", check.reason);

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
  runtime: "nodejs", // <-- FIX PALING PENTING
};
