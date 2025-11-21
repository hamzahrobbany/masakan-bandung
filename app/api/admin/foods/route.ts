// app/api/admin/foods/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const foods = await prisma.food.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(foods);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, price, description, imageUrl, categoryId } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Nama wajib diisi" },
        { status: 400 }
      );
    }
    if (!price || typeof price !== "number") {
      return NextResponse.json(
        { error: "Harga wajib diisi" },
        { status: 400 }
      );
    }
    if (!categoryId || typeof categoryId !== "string") {
      return NextResponse.json(
        { error: "Kategori wajib dipilih" },
        { status: 400 }
      );
    }

    const food = await prisma.food.create({
      data: {
        name,
        price,
        description: description ?? null,
        imageUrl: imageUrl || "https://picsum.photos/400",
        categoryId,
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
