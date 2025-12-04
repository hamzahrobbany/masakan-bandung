import { NextRequest } from "next/server";

import { protectAdminRoute } from "@/lib/protect-admin-route";
import { ADMIN_CSRF_COOKIE, ADMIN_SESSION_COOKIE } from "@/lib/security";
import { success } from "@/utils/response";
export async function POST(req: NextRequest) {
  const { response } = protectAdminRoute(req);
  if (response) return response;
  const res = success();
  res.cookies.delete(ADMIN_SESSION_COOKIE);
  res.cookies.delete(ADMIN_CSRF_COOKIE);
  return res;
}
