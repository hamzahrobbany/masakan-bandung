import { NextRequest } from "next/server";

import {
  protectAdminRoute as enforceAuth,
  type AdminSessionPayload,
} from "@/lib/auth";

type AdminGuardResult = { session: AdminSessionPayload };

export function protectAdminRoute(request: NextRequest): AdminGuardResult {
  const { session } = enforceAuth(request);

  return { session };
}
