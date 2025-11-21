import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ADMIN_SESSION_COOKIE } from "@/lib/security";

export async function POST(req: Request) {
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

    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Password salah" },
        { status: 401 }
      );
    }

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // Redirect ke dashboard setelah login
    const redirectURL = new URL("/admin", req.url);

    const res = NextResponse.redirect(redirectURL);

    res.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
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
