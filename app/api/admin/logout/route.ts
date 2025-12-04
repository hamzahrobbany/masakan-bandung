import { NextRequest } from "next/server";

import { protectAdminRoute } from "@/lib/protect-admin-route";
import { ADMIN_CSRF_COOKIE, ADMIN_SESSION_COOKIE } from "@/lib/security";
import { success } from "@/utils/response";
import { withErrorHandling } from "@/utils/api-handler";

export const POST = withErrorHandling(async (req: NextRequest) => {
  protectAdminRoute(req);
  const res = success();
  res.cookies.delete(ADMIN_SESSION_COOKIE);
  res.cookies.delete(ADMIN_CSRF_COOKIE);
  return res;
});
