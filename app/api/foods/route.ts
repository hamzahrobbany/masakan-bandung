import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { protectAdminRoute } from '@/lib/auth';

export async function GET() {
  const foods = await prisma.food.findMany({ include: { category: true }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(foods);
}

export async function POST(request: NextRequest) {
  const guard = protectAdminRoute(request);
  if ('response' in guard) return guard.response;
  const body = await request.json();
  if (!body.name || body.price === undefined || !body.imageUrl) {
    return NextResponse.json({ error: 'Nama, harga, dan gambar wajib ada' }, { status: 400 });
  }
  const food = await prisma.food.create({
    data: {
      name: body.name,
      price: Number(body.price),
      description: body.description,
      imageUrl: body.imageUrl,
      categoryId: body.categoryId || null
    },
    include: { category: true }
  });
  return NextResponse.json(food, { status: 201 });
}
