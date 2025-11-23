import { NextRequest, NextResponse } from "next/server";

import { validateAdminAuth } from "@/lib/admin-auth";

export function protectAdminRoute(request: NextRequest) {
  const { valid } = validateAdminAuth(request);

  if (valid) {
    return null;
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
