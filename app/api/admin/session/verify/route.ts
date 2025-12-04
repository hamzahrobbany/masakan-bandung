import { NextRequest } from "next/server";

import { getAdminSessionFromRequest } from "@/lib/auth";
import { AuthError } from "@/utils/api-errors";
import { withErrorHandling } from "@/utils/api-handler";
import { success } from "@/utils/response";

export const runtime = "nodejs";

export const GET = withErrorHandling(async (req: NextRequest) => {
  const session = getAdminSessionFromRequest(req);
  if (!session) {
    throw new AuthError("Tidak terautentikasi", {
      headers: { "Cache-Control": "no-store" },
    });
  }

  return success(
    { authenticated: true },
    { headers: { "Cache-Control": "no-store" } }
  );
});
