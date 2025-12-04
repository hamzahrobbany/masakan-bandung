import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { attachSessionCookie, verifyPassword } from "@/lib/auth";
import {
  ADMIN_LOGIN_PATH,
  ADMIN_ROUTE_PREFIX,
} from "@/lib/security";

function sanitizeRedirect(target?: string | null) {
  if (!target) return ADMIN_ROUTE_PREFIX;
  return target.startsWith(ADMIN_ROUTE_PREFIX)
    ? target
    : ADMIN_ROUTE_PREFIX;
}

function redirectWithError(
  req: NextRequest,
  message: string,
  redirectParam: string
) {
  const url = new URL(ADMIN_LOGIN_PATH, req.url);
  if (redirectParam.startsWith(ADMIN_ROUTE_PREFIX)) {
    url.searchParams.set("redirect", redirectParam);
  }
  url.searchParams.set("error", message);

  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    let email = "";
    let password = "";
    let redirectParam = ADMIN_ROUTE_PREFIX;

    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => null);
      email = body?.email?.toString().trim() ?? "";
      password = body?.password?.toString() ?? "";
      redirectParam = sanitizeRedirect(body?.redirect);
    } else {
      const formData = await req.formData();
      email = formData.get("email")?.toString().trim() ?? "";
      password = formData.get("password")?.toString() ?? "";
      redirectParam = sanitizeRedirect(formData.get("redirect")?.toString());
    }

    if (!email || !password) {
      return redirectWithError(
        req,
        "Email dan password wajib diisi",
        redirectParam
      );
    }

    const admin = await prisma.admin.findFirst({
      where: { email, deletedAt: null },
    });
    if (!admin) {
      return redirectWithError(req, "Email tidak ditemukan", redirectParam);
    }

    const isValid = await verifyPassword(password, admin.passwordHash);
    if (!isValid) {
      return redirectWithError(req, "Password salah", redirectParam);
    }

    const redirectUrl = new URL(redirectParam, req.url);
    const res = NextResponse.redirect(redirectUrl, { status: 303 });
    attachSessionCookie(res, {
      id: admin.id,
      email: admin.email,
      name: admin.name,
    });
    return res;
  } catch (error) {
    console.error("Login error:", error);
    return redirectWithError(
      req,
      "Login gagal. Coba lagi.",
      ADMIN_ROUTE_PREFIX
    );
  }
}
