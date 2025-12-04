import { NextResponse, NextRequest } from 'next/server';

import {
  generateAdminCsrfToken,
  getAdminSessionFromRequest,
  persistAdminCsrfToken
} from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// ===========================================================
// GET /api/admin/session
// ===========================================================
export async function GET(request: NextRequest) {
  try {
    // Ambil session dari cookie request
    const session = getAdminSessionFromRequest(request);
    if (!session) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Ambil data admin dari database
    const admin = await prisma.admin.findFirst({
      where: { id: session.id, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    if (!admin) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Generate CSRF token baru
    const csrfToken = generateAdminCsrfToken();

    // Bentuk response
    const res = NextResponse.json(
      { authenticated: true, admin, csrfToken },
      { headers: { 'Cache-Control': 'no-store' } }
    );

    // Simpan CSRF ke cookie
    persistAdminCsrfToken(res, csrfToken);

    return res;

  } catch (error) {
    console.error('Admin session error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
