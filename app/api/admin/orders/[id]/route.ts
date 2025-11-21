// app/api/admin/orders/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type Params = { params: { id: string } };

export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = params;
    const { status } = await req.json();

    if (
      !["PENDING", "PROCESSED", "DONE", "CANCELLED"].includes(status)
    ) {
      return NextResponse.json(
        { error: "Status tidak valid" },
        { status: 400 }
      );
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(order);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Gagal update pesanan" },
      { status: 500 }
    );
  }
}
