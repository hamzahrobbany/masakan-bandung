import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { attachSessionCookie, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Email tidak ditemukan" },
        { status: 404 }
      );
    }

    const isValid = await verifyPassword(password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Password salah" },
        { status: 401 }
      );
    }

    // Redirect ke dashboard setelah login
    const redirectURL = new URL("/admin", req.url);

    const res = NextResponse.redirect(redirectURL);
    attachSessionCookie(res, {
      id: admin.id,
      email: admin.email,
      name: admin.name,
    });

    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Login gagal" },
      { status: 500 }
    );
  }
}
