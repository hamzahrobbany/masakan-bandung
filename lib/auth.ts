import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import {
  ADMIN_CSRF_COOKIE,
  ADMIN_SESSION_COOKIE,
  ADMIN_TOKEN_HEADER
} from '@/lib/security';

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

function getAdminSecret() {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error('ADMIN_SECRET belum diatur.');
  }
  return secret;
}

function hashCsrfToken(token: string) {
  return createHmac('sha256', getAdminSecret()).update(token).digest('hex');
}

function persistCsrfCookie(response: NextResponse, hashedToken: string) {
  response.cookies.set(ADMIN_CSRF_COOKIE, hashedToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: TOKEN_TTL_SECONDS
  });
}

function shouldValidateCsrf(method: string) {
  return !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}

function generateCsrfToken() {
  return randomBytes(32).toString('hex');
}

export function generateAdminCsrfToken() {
  return generateCsrfToken();
}

export function persistAdminCsrfToken(response: NextResponse, token: string) {
  const hashed = hashCsrfToken(token);
  persistCsrfCookie(response, hashed);
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
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: TOKEN_TTL_SECONDS
  });
}

export function destroyAdminSession(response: NextResponse) {
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    path: '/',
    maxAge: 0
  });
}

export async function getAdminSessionFromCookies() {
  const store = cookies();
  const token = store.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function getAdminSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export function attachSessionCookie(response: NextResponse, payload: AdminSessionPayload) {
  const token = createSessionToken(payload);
  persistAdminSession(response, token);
}

export function protectAdminRoute(request: NextRequest) {
  const session = getAdminSessionFromRequest(request);
  if (!session) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (shouldValidateCsrf(request.method)) {
    const csrfHeader = request.headers.get(ADMIN_TOKEN_HEADER);
    const storedHash = request.cookies.get(ADMIN_CSRF_COOKIE)?.value;
    if (!csrfHeader || !storedHash) {
      return { response: NextResponse.json({ error: 'CSRF token missing' }, { status: 403 }) };
    }
    const hashedHeader = hashCsrfToken(csrfHeader);
    const headerBuffer = Buffer.from(hashedHeader);
    const cookieBuffer = Buffer.from(storedHash);
    if (headerBuffer.length !== cookieBuffer.length || !timingSafeEqual(headerBuffer, cookieBuffer)) {
      return { response: NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 }) };
    }
  }
  return { session } as const;
}
