import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { protectAdminRoute } from '@/lib/auth';

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const guard = protectAdminRoute(request);
  if ('response' in guard) return guard.response;
  const body = await request.json();
  if (!body.name) {
    return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 });
  }
  const category = await prisma.category.create({ data: { name: body.name } });
  return NextResponse.json(category, { status: 201 });
}
