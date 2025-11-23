import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

import { ADMIN_SESSION_COOKIE } from "@/lib/security";

export type AdminJwtPayload = jwt.JwtPayload & {
  id?: string;
  email?: string;
  name?: string | null;
};

export function validateAdminAuth(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return { valid: false, decoded: null as AdminJwtPayload | null };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AdminJwtPayload;
    return { valid: true, decoded };
  } catch (error) {
    console.error("Admin JWT invalid:", error);
    return { valid: false, decoded: null as AdminJwtPayload | null };
  }
}
