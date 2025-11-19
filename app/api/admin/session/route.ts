import { NextResponse, NextRequest } from "next/server";
import { getAdminSessionFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
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
  return NextResponse.json({ authenticated: true, admin });
}
