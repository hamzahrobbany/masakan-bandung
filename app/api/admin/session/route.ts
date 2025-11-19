import { NextResponse, NextRequest } from 'next/server';

import {
  generateAdminCsrfToken,
  getAdminSessionFromRequest,
  persistAdminCsrfToken
} from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = getAdminSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    const admin = await prisma.admin.findUnique({
      where: { id: session.id },
      select: { id: true, email: true, name: true, createdAt: true }
    });
    if (!admin) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    const csrfToken = generateAdminCsrfToken();
    const response = NextResponse.json({ authenticated: true, admin, csrfToken }, { headers: { 'Cache-Control': 'no-store' } });
    persistAdminCsrfToken(response, csrfToken);
    return response;
  } catch (error) {
    console.error('Admin session error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan pada server' }, { status: 500 });
  }
}
