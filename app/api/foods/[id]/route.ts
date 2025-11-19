import { NextResponse, NextRequest } from "next/server";
import prisma from '@/lib/prisma';
import { protectAdminRoute } from '@/lib/auth';

type ParamsPromise = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: ParamsPromise) {
  const { id } = await context.params;
  const food = await prisma.food.findUnique({ where: { id }, include: { category: true } });
  if (!food) {
    return NextResponse.json({ error: 'Food not found' }, { status: 404 });
  }
  return NextResponse.json(food);
}

export async function PUT(request: NextRequest, context: ParamsPromise) {
  const { id } = await context.params;
  const guard = protectAdminRoute(request);
  if ('response' in guard) return guard.response;
  const body = await request.json();
  if (!body.name || body.price === undefined || !body.imageUrl) {
    return NextResponse.json({ error: 'Data makanan belum lengkap' }, { status: 400 });
  }
  const food = await prisma.food.update({
    where: { id },
    data: {
      name: body.name,
      price: Number(body.price),
      description: body.description,
      imageUrl: body.imageUrl,
      categoryId: body.categoryId || null
    },
    include: { category: true }
  });
  return NextResponse.json(food);
}

export async function DELETE(request: NextRequest, context: ParamsPromise) {
  const { id } = await context.params;
  const guard = protectAdminRoute(request);
  if ('response' in guard) return guard.response;
  await prisma.food.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
