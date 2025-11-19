import { NextResponse, NextRequest } from 'next/server';

import { protectAdminRoute } from '@/lib/auth';
import { sanitizeFoodPayload } from '@/lib/food-validation';
import prisma from '@/lib/prisma';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function parsePagination(searchParams: URLSearchParams) {
  const pageParam = Number(searchParams.get('page') ?? '1');
  const limitParam = Number(searchParams.get('limit') ?? DEFAULT_LIMIT);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(Math.floor(limitParam), MAX_LIMIT) : DEFAULT_LIMIT;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export async function GET(request: NextRequest) {
  try {
    const { page, limit, skip } = parsePagination(request.nextUrl.searchParams);
    const [foods, total] = await Promise.all([
      prisma.food.findMany({
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.food.count()
    ]);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return NextResponse.json(
      {
        data: foods,
        meta: { page, limit, total, totalPages }
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Foods GET error:', error);
    return NextResponse.json({ error: 'Gagal memuat data makanan' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const guard = protectAdminRoute(request);
  if ('response' in guard) return guard.response;

  try {
    const body = await request.json().catch(() => null);
    const result = sanitizeFoodPayload(body);
    if (result.error || !result.value) {
      return NextResponse.json({ error: result.error ?? 'Payload tidak valid' }, { status: 400 });
    }

    const food = await prisma.food.create({
      data: {
        name: result.value.name,
        price: result.value.price,
        description: result.value.description,
        imageUrl: result.value.imageUrl,
        categoryId: result.value.categoryId
      },
      include: { category: true }
    });
    return NextResponse.json(food, { status: 201 });
  } catch (error) {
    console.error('Foods POST error:', error);
    return NextResponse.json({ error: 'Gagal membuat makanan' }, { status: 500 });
  }
}
