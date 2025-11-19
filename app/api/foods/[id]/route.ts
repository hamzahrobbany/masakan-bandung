import { Prisma } from '@prisma/client';
import { NextResponse, NextRequest } from 'next/server';

import { protectAdminRoute } from '@/lib/auth';
import { sanitizeFoodPayload } from '@/lib/food-validation';
import prisma from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Params) {
  try {
    const { id } = await context.params; // ✅ FIX

    const food = await prisma.food.findUnique({
      where: { id },
      include: { category: true }
    });

    if (!food) {
      return NextResponse.json({ error: 'Food not found' }, { status: 404 });
    }

    return NextResponse.json(food, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Food detail GET error:', error);
    return NextResponse.json({ error: 'Gagal memuat data makanan' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: Params) {
  const guard = protectAdminRoute(request);
  if ('response' in guard) return guard.response;

  try {
    const { id } = await context.params; // ✅ FIX

    const body = await request.json().catch(() => null);
    const result = sanitizeFoodPayload(body);

    if (result.error || !result.value) {
      return NextResponse.json({ error: result.error ?? 'Payload tidak valid' }, { status: 400 });
    }

    const food = await prisma.food.update({
      where: { id },
      data: {
        name: result.value.name,
        price: result.value.price,
        description: result.value.description,
        imageUrl: result.value.imageUrl,
        categoryId: result.value.categoryId
      },
      include: { category: true }
    });

    return NextResponse.json(food);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Food not found' }, { status: 404 });
    }
    console.error('Food PUT error:', error);
    return NextResponse.json({ error: 'Gagal memperbarui makanan' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: Params) {
  const guard = protectAdminRoute(request);
  if ('response' in guard) return guard.response;

  try {
    const { id } = await context.params; // ✅ FIX

    await prisma.food.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Food not found' }, { status: 404 });
    }
    console.error('Food DELETE error:', error);
    return NextResponse.json({ error: 'Gagal menghapus makanan' }, { status: 500 });
  }
}
