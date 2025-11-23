// app/api/admin/logout/route.ts
import { NextResponse } from "next/server";

import { ADMIN_CSRF_COOKIE, ADMIN_SESSION_COOKIE } from "@/lib/security";

export async function POST(req: Request) {
  const url = new URL("/admin/login", req.url);
  const res = NextResponse.redirect(url);

  res.cookies.delete(ADMIN_SESSION_COOKIE);
  res.cookies.delete(ADMIN_CSRF_COOKIE);

  return res;
}
