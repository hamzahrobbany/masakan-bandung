// app/api/admin/logout/route.ts

import { NextRequest, NextResponse } from "next/server";

import { protectAdminRoute } from "@/lib/protect-admin-route";
import { ADMIN_CSRF_COOKIE, ADMIN_SESSION_COOKIE } from "@/lib/security";
export async function POST(req: NextRequest) {
  const { response } = protectAdminRoute(req);
  if (response) return response;
  const url = new URL("/admin/login", req.url);
  const res = NextResponse.redirect(url);
  res.cookies.delete(ADMIN_SESSION_COOKIE);
  res.cookies.delete(ADMIN_CSRF_COOKIE);
  return res;
}
