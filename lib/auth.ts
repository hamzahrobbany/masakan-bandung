import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';

const ADMIN_COOKIE = 'masakan-bandung-admin';
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 hari
const JWT_HEADER = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET belum diatur.');
  }
  return secret;
}

function base64UrlEncode(payload: object) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export async function verifyPassword(password: string, hashed: string) {
  const [salt, stored] = hashed.split(':');
  if (!salt || !stored) return false;
  const derived = scryptSync(password, salt, 64).toString('hex');
  return timingSafeEqual(Buffer.from(stored, 'hex'), Buffer.from(derived, 'hex'));
}

export type AdminSessionPayload = {
  id: string;
  email: string;
  name?: string | null;
};

export function createSessionToken(payload: AdminSessionPayload) {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const header = JWT_HEADER;
  const body = base64UrlEncode({ ...payload, exp });
  const unsigned = `${header}.${body}`;
  const signature = createHmac('sha256', getJwtSecret()).update(unsigned).digest('base64url');
  return `${unsigned}.${signature}`;
}

export function verifySessionToken(token: string): (AdminSessionPayload & { exp: number }) | null {
  try {
    const [header, body, signature] = token.split('.');
    if (!header || !body || !signature) return null;
    const expected = createHmac('sha256', getJwtSecret()).update(`${header}.${body}`).digest('base64url');
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch (error) {
    console.error('Gagal memverifikasi token', error);
    return null;
  }
}

export function persistAdminSession(response: NextResponse, token: string) {
  response.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: TOKEN_TTL_SECONDS
  });
}

export function destroyAdminSession(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE, '', {
    path: '/',
    maxAge: 0
  });
}

export async function getAdminSessionFromCookies() {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function getAdminSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function attachSessionCookie(response: NextResponse, payload: AdminSessionPayload) {
  const token = createSessionToken(payload);
  persistAdminSession(response, token);
}
