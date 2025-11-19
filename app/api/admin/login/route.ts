import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { attachSessionCookie, verifyPassword } from '@/lib/auth';

export async function POST(request: Request) {
  const { email, password } = await request.json();
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

  const response = NextResponse.json({ success: true });
  attachSessionCookie(response, { id: admin.id, email: admin.email, name: admin.name });
  return response;
}
