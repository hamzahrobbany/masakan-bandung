// app/api/admin/foods/route.ts
import { NextRequest, NextResponse } from "next/server";

import { protectAdminRoute } from "@/lib/protect-admin-route";
import prisma from "@/lib/prisma";
import { createFoodRequestSchema } from "@/schemas/food.schema";
import { validateRequest } from "@/utils/validate-request";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { response } = protectAdminRoute(req);
  if (response) return response;

  try {
    const foods = await prisma.food.findMany({
      where: { deletedAt: null },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(foods);
  } catch (error) {
    console.error("Gagal memuat makanan:", error);
    return NextResponse.json(
      { error: "Gagal memuat makanan" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { response, session } = protectAdminRoute(req);
  if (response) return response;

  try {
    const body = await req.json().catch(() => null);
    const validation = validateRequest(createFoodRequestSchema, body);

    if (!validation.success) {
      return NextResponse.json(validation.error, { status: 400 });
    }

    const {
      name,
      price,
      description,
      imageUrl,
      categoryId,
      stock,
      rating,
      isFeatured,
      isAvailable,
    } = validation.data;

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category || category.deletedAt) {
      return NextResponse.json(
        { error: "Kategori tidak ditemukan" },
        { status: 404 }
      );
    }

    const adminId = session.id;

    const food = await prisma.food.create({
      data: {
        name,
        price,
        description: description ?? null,
        imageUrl: imageUrl || "https://picsum.photos/400",
        categoryId,
        stock: stock ?? 0,
        rating: rating ?? 5,
        isFeatured: Boolean(isFeatured),
        isAvailable: isAvailable ?? true,
        createdBy: adminId,
        updatedBy: adminId,
      },
    });

    return NextResponse.json(food, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Gagal membuat makanan" },
      { status: 500 }
    );
  }
}
