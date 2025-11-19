import { NextResponse, NextRequest } from 'next/server';

import { protectAdminRoute } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json(categories, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json({ error: 'Gagal memuat kategori' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = protectAdminRoute(request);
  if ('response' in guard) return guard.response;

  try {
    const body = await request.json().catch(() => null);
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 });
    }
    const category = await prisma.category.create({ data: { name } });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Categories POST error:', error);
    return NextResponse.json({ error: 'Gagal membuat kategori' }, { status: 500 });
  }
}
