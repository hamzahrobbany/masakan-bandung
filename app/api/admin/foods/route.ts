// app/api/admin/foods/route.ts
import { NextRequest, NextResponse } from "next/server";
import { protectAdminRoute } from "@/lib/protect-admin-route";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const guard = protectAdminRoute(req);
  if (guard) return guard;

  const foods = await prisma.food.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(foods);
}

export async function POST(req: NextRequest) {
  const guard = protectAdminRoute(req);
  if (guard) return guard;

  try {
    const body = await req.json();
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
    } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Nama wajib diisi" },
        { status: 400 }
      );
    }
    if (price === undefined || typeof price !== "number") {
      return NextResponse.json(
        { error: "Harga wajib diisi" },
        { status: 400 }
      );
    }
    if (price < 0) {
      return NextResponse.json(
        { error: "Harga tidak boleh negatif" },
        { status: 400 }
      );
    }
    if (!categoryId || typeof categoryId !== "string") {
      return NextResponse.json(
        { error: "Kategori wajib dipilih" },
        { status: 400 }
      );
    }

    if (stock !== undefined) {
      if (typeof stock !== "number") {
        return NextResponse.json(
          { error: "Stok harus berupa angka" },
          { status: 400 }
        );
      }
      if (stock < 0) {
        return NextResponse.json(
          { error: "Stok tidak boleh negatif" },
          { status: 400 }
        );
      }
    }

    if (rating !== undefined) {
      if (typeof rating !== "number") {
        return NextResponse.json(
          { error: "Rating harus berupa angka" },
          { status: 400 }
        );
      }
      if (rating < 0 || rating > 5) {
        return NextResponse.json(
          { error: "Rating harus di antara 0 hingga 5" },
          { status: 400 }
        );
      }
    }

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
