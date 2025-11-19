import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { protectAdminRoute } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json(category, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Category GET error:', error);
    return NextResponse.json({ error: 'Gagal memuat kategori' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = protectAdminRoute(request);
  if ('response' in guard) return guard.response;

  const { id } = await context.params;

  try {
    const body = await request.json().catch(() => null);
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 });
    }

    const category = await prisma.category.update({ where: { id }, data: { name } });
    return NextResponse.json(category);
  } catch (error) {
    console.error('Category PUT error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Nama kategori sudah digunakan' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Gagal memperbarui kategori' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = protectAdminRoute(request);
  if ('response' in guard) return guard.response;

  const { id } = await context.params;

  try {
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Category DELETE error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Kategori masih digunakan oleh makanan lain, silakan pindahkan terlebih dahulu.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Gagal menghapus kategori' }, { status: 500 });
  }
}
