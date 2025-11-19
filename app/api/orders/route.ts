import { NextRequest, NextResponse } from 'next/server';

import { OrderStatus } from '@prisma/client';

import { protectAdminRoute } from '@/lib/auth';
import prisma from '@/lib/prisma';

const ORDER_STATUSES = Object.values(OrderStatus);

type RawOrderItem = { foodId?: unknown; quantity?: unknown };

function sanitizeItems(raw: unknown) {
  if (!Array.isArray(raw)) return [] as { foodId: string; quantity: number }[];
  return raw
    .map((item: RawOrderItem) => ({
      foodId: typeof item?.foodId === 'string' ? item.foodId : '',
      quantity: Number(item?.quantity ?? 0)
    }))
    .filter((item) => item.foodId && Number.isFinite(item.quantity) && item.quantity > 0);
}

export async function GET(request: NextRequest) {
  const guard = protectAdminRoute(request);
  if ('response' in guard) return guard.response;

  try {
    const statusFilter = request.nextUrl.searchParams.get('status');
    const where = statusFilter && ORDER_STATUSES.includes(statusFilter as OrderStatus)
      ? { status: statusFilter as OrderStatus }
      : undefined;
    const orders = await prisma.order.findMany({
      where,
      include: { items: { include: { food: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(orders, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json({ error: 'Gagal memuat pesanan' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const customerName = typeof body?.customerName === 'string' ? body.customerName.trim() : null;
    const customerPhone = typeof body?.customerPhone === 'string' ? body.customerPhone.trim() : null;
    const note = typeof body?.note === 'string' ? body.note.trim() : null;
    const items = sanitizeItems(body?.items);

    if (!items.length) {
      return NextResponse.json({ error: 'Item pesanan wajib diisi' }, { status: 400 });
    }

    const foodIds = items.map((item) => item.foodId);
    const foods = await prisma.food.findMany({ where: { id: { in: foodIds } } });
    if (foods.length !== items.length) {
      return NextResponse.json({ error: 'Beberapa makanan tidak ditemukan' }, { status: 400 });
    }

    const itemsWithSnapshot = items.map((item) => {
      const food = foods.find((f) => f.id === item.foodId)!;
      return {
        foodId: food.id,
        foodName: food.name,
        foodPrice: food.price,
        quantity: item.quantity
      };
    });

    const total = itemsWithSnapshot.reduce((sum, item) => sum + item.foodPrice * item.quantity, 0);

    const order = await prisma.order.create({
      data: {
        customerName,
        customerPhone,
        note,
        total,
        items: { create: itemsWithSnapshot }
      },
      include: { items: { include: { food: true } } }
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Orders POST error:', error);
    return NextResponse.json({ error: 'Gagal membuat pesanan' }, { status: 500 });
  }
}
