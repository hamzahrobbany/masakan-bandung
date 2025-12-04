// app/api/admin/foods/route.ts
import { NextRequest, NextResponse } from "next/server";

import { protectAdminRoute } from "@/lib/protect-admin-route";
import prisma from "@/lib/prisma";

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
