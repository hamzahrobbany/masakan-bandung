// app/api/admin/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

import { protectAdminRoute } from "@/lib/protect-admin-route";
import prisma from "@/lib/prisma";

type Params = { params: { id: string } };

export const runtime = "nodejs";

export async function PUT(req: NextRequest, { params }: Params) {
  const guard = protectAdminRoute(req);
  if (guard) return guard;

  try {
    const id = params?.id?.trim();
    if (!id) {
      return NextResponse.json(
        { error: "ID pesanan tidak valid" },
        { status: 400 }
      );
    }

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan" },
        { status: 404 }
      );
    }
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
