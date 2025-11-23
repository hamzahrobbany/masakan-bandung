// app/api/admin/foods/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { protectAdminRoute } from "@/lib/protect-admin-route";
import prisma from "@/lib/prisma";

type Params = { params: { id: string } };

type FoodUpdatePayload = {
  name?: string;
  price?: number;
  description?: string | null;
  imageUrl?: string;
  categoryId?: string;
  isAvailable?: boolean;
  stock?: number;
  rating?: number;
  isFeatured?: boolean;
};

export const runtime = "nodejs";

export async function PUT(req: NextRequest, { params }: Params) {
  const guard = protectAdminRoute(req);
  if (guard) return guard;

  try {
    const { id } = params;
    const body = (await req.json()) as FoodUpdatePayload;

    const data: FoodUpdatePayload = {};

    if (typeof body.name === "string") data.name = body.name;
    if (typeof body.price === "number") {
      if (body.price < 0) {
        return NextResponse.json(
          { error: "Harga tidak boleh negatif" },
          { status: 400 }
        );
      }
      data.price = body.price;
    }
    if (typeof body.description === "string" || body.description === null)
      data.description = body.description;
    if (typeof body.imageUrl === "string") data.imageUrl = body.imageUrl;
    if (typeof body.categoryId === "string") data.categoryId = body.categoryId;
    if (typeof body.isAvailable === "boolean")
      data.isAvailable = body.isAvailable;
    if (typeof body.stock === "number") {
      if (body.stock < 0) {
        return NextResponse.json(
          { error: "Stok tidak boleh negatif" },
          { status: 400 }
        );
      }
      data.stock = body.stock;
    }
    if (typeof body.rating === "number") {
      if (body.rating < 0 || body.rating > 5) {
        return NextResponse.json(
          { error: "Rating harus di antara 0 hingga 5" },
          { status: 400 }
        );
      }
      data.rating = body.rating;
    }
    if (typeof body.isFeatured === "boolean") data.isFeatured = body.isFeatured;

    const food = await prisma.food.update({
      where: { id },
      data,
    });

    return NextResponse.json(food);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Gagal update makanan" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const guard = protectAdminRoute(req);
  if (guard) return guard;

  try {
    const { id } = params;
    await prisma.food.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Gagal hapus makanan" },
      { status: 500 }
    );
  }
}
