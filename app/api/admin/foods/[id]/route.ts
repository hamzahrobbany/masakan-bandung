// app/api/admin/foods/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Params = { params: { id: string } };

export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = params;
    const body = await req.json();

    const data: any = {};

    if (typeof body.name === "string") data.name = body.name;
    if (typeof body.price === "number") data.price = body.price;
    if (typeof body.description === "string" || body.description === null)
      data.description = body.description;
    if (typeof body.imageUrl === "string") data.imageUrl = body.imageUrl;
    if (typeof body.categoryId === "string") data.categoryId = body.categoryId;
    if (typeof body.isAvailable === "boolean")
      data.isAvailable = body.isAvailable;

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

export async function DELETE(_req: Request, { params }: Params) {
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
