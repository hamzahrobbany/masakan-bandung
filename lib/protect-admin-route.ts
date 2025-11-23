import { NextRequest } from "next/server";

import { protectAdminRoute as enforceAuth } from "@/lib/auth";

export function protectAdminRoute(request: NextRequest) {
  const result = enforceAuth(request);
  if (result.response) {
    return result.response;
  }

  return undefined;
}
