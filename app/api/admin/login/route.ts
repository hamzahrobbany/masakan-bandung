import { NextResponse, NextRequest } from 'next/server';

import { attachSessionCookie, generateAdminCsrfToken, persistAdminCsrfToken, verifyPassword } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 });
    }

    const admin = await prisma.admin.findUnique({ where: { email } });
    if (!admin) {
      return NextResponse.json({ error: 'Kredensial salah' }, { status: 401 });
    }

    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Kredensial salah' }, { status: 401 });
    }

    const adminPayload = { id: admin.id, email: admin.email, name: admin.name };
    const csrfToken = generateAdminCsrfToken();
    const response = NextResponse.json(
      { success: true, admin: adminPayload, csrfToken },
      { headers: { 'Cache-Control': 'no-store' } }
    );
    attachSessionCookie(response, adminPayload);
    persistAdminCsrfToken(response, csrfToken);
    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
