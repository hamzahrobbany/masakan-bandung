import { NextRequest, NextResponse } from "next/server";

import {
  protectAdminRoute as enforceAuth,
  type AdminSessionPayload,
} from "@/lib/auth";

type AdminGuardResult =
  | { response: NextResponse; session?: undefined }
  | { response?: undefined; session: AdminSessionPayload };

export function protectAdminRoute(request: NextRequest): AdminGuardResult {
  const result = enforceAuth(request);
  if (result.response) {
    return { response: result.response };
  }

  return { session: result.session };
}
