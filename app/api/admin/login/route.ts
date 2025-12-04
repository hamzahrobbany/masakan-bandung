import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { attachSessionCookie, verifyPassword } from "@/lib/auth";
import { ADMIN_LOGIN_PATH, ADMIN_ROUTE_PREFIX } from "@/lib/security";
import { adminLoginRequestSchema } from "@/schemas/admin-login.schema";
import { validateRequest } from "@/utils/validate-request";
import { enforceIpRateLimit } from "@/middleware/rate-limit";
import { withErrorHandling } from "@/utils/api-handler";

function sanitizeRedirect(target?: string | null) {
  if (!target) return ADMIN_ROUTE_PREFIX;
  return target.startsWith(ADMIN_ROUTE_PREFIX) ? target : ADMIN_ROUTE_PREFIX;
}

async function parsePayload(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => null);
    return {
      email: body?.email?.toString(),
      password: body?.password?.toString(),
      redirect: body?.redirect?.toString(),
    };
  }

  const formData = await req.formData();
  return {
    email: formData.get("email")?.toString(),
    password: formData.get("password")?.toString(),
    redirect: formData.get("redirect")?.toString(),
  };
}

function redirectWithError(req: NextRequest, message: string, redirectParam: string) {
  const url = new URL(ADMIN_LOGIN_PATH, req.url);
  if (redirectParam.startsWith(ADMIN_ROUTE_PREFIX)) {
    url.searchParams.set("redirect", redirectParam);
  }
  url.searchParams.set("error", message);

  return NextResponse.redirect(url, { status: 303 });
}

export const POST = withErrorHandling(async (req: NextRequest) => {
  await enforceIpRateLimit(req, {
    max: 5,
    windowMs: 10 * 60 * 1000,
    route: "/api/admin/login",
    name: "admin-login",
  });

  try {
    const rawPayload = await parsePayload(req);
    const validation = validateRequest(adminLoginRequestSchema, rawPayload, {
      errorMessage: "Email dan password wajib diisi",
    });

    const redirectParam = sanitizeRedirect(rawPayload.redirect);

    if (!validation.success) {
      const message = validation.error.details?.[0] ?? validation.error.error;
      return redirectWithError(req, message, redirectParam);
    }

    const { email, password, redirect } = validation.data;

    const admin = await prisma.admin.findFirst({
      where: { email, deletedAt: null },
    });
    if (!admin) {
      return redirectWithError(req, "Email tidak ditemukan", redirect);
    }

    const isValid = await verifyPassword(password, admin.passwordHash);
    if (!isValid) {
      return redirectWithError(req, "Password salah", redirect);
    }

    const redirectUrl = new URL(redirect, req.url);
    const res = NextResponse.redirect(redirectUrl, { status: 303 });
    attachSessionCookie(res, {
      id: admin.id,
      email: admin.email,
      name: admin.name,
    });
    return res;
  } catch (error) {
    console.error("Login error:", error);
    return redirectWithError(req, "Login gagal. Coba lagi.", ADMIN_ROUTE_PREFIX);
  }
});
