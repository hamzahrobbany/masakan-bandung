import { NextRequest, NextResponse } from "next/server";

import { ADMIN_LOGIN_PATH, ADMIN_ROUTE_PREFIX } from "@/lib/security";

async function isAuthorized(req: NextRequest) {
  const verifyUrl = new URL("/api/admin/session/verify", req.url);

  try {
    const response = await fetch(verifyUrl, {
      headers: {
        cookie: req.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    });
    return response.ok;
  } catch (error) {
    console.error("Middleware auth check failed:", error);
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  if (!path.startsWith(ADMIN_ROUTE_PREFIX)) {
    return NextResponse.next();
  }

  if (path === ADMIN_LOGIN_PATH || path.startsWith(`${ADMIN_LOGIN_PATH}/`)) {
    return NextResponse.next();
  }

  const authorized = await isAuthorized(req);
  if (!authorized) {
    const loginURL = new URL(ADMIN_LOGIN_PATH, req.url);
    loginURL.searchParams.set("redirect", path);

    return NextResponse.redirect(loginURL);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
