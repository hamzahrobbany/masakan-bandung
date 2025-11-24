// lib/auth.ts

import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_CSRF_COOKIE,
  ADMIN_SESSION_COOKIE,
  ADMIN_TOKEN_HEADER,
} from "@/lib/security";

// =======================================================
// ENV (selalu pakai env.ts karena seed pakai auth.seed.ts)
// =======================================================
import { serverEnv } from "./env";

// =======================================================
// PASSWORD (bcrypt)
// =======================================================

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hashed: string) {
  if (!hashed) return false;
  return bcrypt.compare(password, hashed);
}

// =======================================================
// CSRF Token
// =======================================================

export function generateAdminCsrfToken() {
  return randomBytes(32).toString("hex");
}

function hashCsrfToken(token: string) {
  return createHmac("sha256", serverEnv.adminSecret)
    .update(token)
    .digest("hex");
}

export function persistAdminCsrfToken(response: NextResponse, token: string) {
  const hashed = hashCsrfToken(token);

  response.cookies.set(ADMIN_CSRF_COOKIE, hashed, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  });
}

// =======================================================
// SESSION TOKEN (JWT HS256)
// =======================================================

export type AdminSessionPayload = {
  id: string;
  email: string;
  name?: string | null;
};

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 hari

const JWT_HEADER = Buffer.from(
  JSON.stringify({ alg: "HS256", typ: "JWT" })
).toString("base64url");

export function createSessionToken(payload: AdminSessionPayload) {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;

  const header = JWT_HEADER;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString(
    "base64url"
  );

  const unsigned = `${header}.${body}`;

  const signature = createHmac("sha256", serverEnv.jwtSecret)
    .update(unsigned)
    .digest("base64url");

  return `${unsigned}.${signature}`;
}

export function verifySessionToken(
  token: string
): (AdminSessionPayload & { exp: number }) | null {
  try {
    const [header, body, signature] = token.split(".");
    if (!header || !body || !signature) return null;

    const expectedSig = createHmac("sha256", serverEnv.jwtSecret)
      .update(`${header}.${body}`)
      .digest("base64url");

    if (
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
    ) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(body, "base64url").toString());

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

// =======================================================
// SESSION COOKIE
// =======================================================

export function persistAdminSession(
  response: NextResponse,
  token: string
) {
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  });
}

export function destroyAdminSession(response: NextResponse) {
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    path: "/",
    maxAge: 0,
  });
}

// =======================================================
// SESSION READERS
// =======================================================

export async function getAdminSessionFromCookies() {
  const store = await cookies();
  const token = store.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  return verifySessionToken(token);
}

export function getAdminSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  return verifySessionToken(token);
}

export function attachSessionCookie(
  response: NextResponse,
  payload: AdminSessionPayload
) {
  const token = createSessionToken(payload);
  persistAdminSession(response, token);
}

// =======================================================
// PROTECT ROUTES (Admin Only)
// =======================================================

function shouldValidateCsrf(method: string) {
  return method.toUpperCase() !== "OPTIONS";
}

export function protectAdminRoute(request: NextRequest) {
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (shouldValidateCsrf(request.method)) {
    const csrfHeader = request.headers.get(ADMIN_TOKEN_HEADER);
    const storedHash = request.cookies.get(ADMIN_CSRF_COOKIE)?.value;

    if (!csrfHeader || !storedHash) {
      return {
        response: NextResponse.json(
          { error: "CSRF token missing" },
          { status: 403 }
        ),
      };
    }

    const hashedHeader = hashCsrfToken(csrfHeader);

    if (
      !timingSafeEqual(
        Buffer.from(hashedHeader),
        Buffer.from(storedHash)
      )
    ) {
      return {
        response: NextResponse.json(
          { error: "Invalid CSRF token" },
          { status: 403 }
        ),
      };
    }
  }

  return { session };
}
