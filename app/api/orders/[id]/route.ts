import { NextRequest, NextResponse } from 'next/server';
import { OrderStatus, Prisma } from '@prisma/client';

import { protectAdminRoute } from '@/lib/auth';
import prisma from '@/lib/prisma';

const ORDER_STATUSES = Object.values(OrderStatus);

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = protectAdminRoute(request);
  if ('response' in guard) return guard.response;

  const { id } = await context.params;

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { food: true } } }
    });
    if (!order) {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json(order, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Order GET error:', error);
    return NextResponse.json({ error: 'Gagal memuat pesanan' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = protectAdminRoute(request);
  if ('response' in guard) return guard.response;

  const { id } = await context.params;

  try {
    const body = await request.json().catch(() => null);
    const status = typeof body?.status === 'string' ? body.status : '';
    if (!ORDER_STATUSES.includes(status as OrderStatus)) {
      return NextResponse.json({ error: 'Status pesanan tidak valid' }, { status: 400 });
    }

    const order = await prisma.order.update({ where: { id }, data: { status: status as OrderStatus } });
    return NextResponse.json(order);
  } catch (error) {
    console.error('Order PUT error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Gagal memperbarui pesanan' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = protectAdminRoute(request);
  if ('response' in guard) return guard.response;

  const { id } = await context.params;

  try {
    await prisma.order.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Order DELETE error:', error);
    return NextResponse.json({ error: 'Gagal menghapus pesanan' }, { status: 500 });
  }
}
