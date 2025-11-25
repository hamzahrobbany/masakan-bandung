// app/api/admin/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

import { protectAdminRoute } from "@/lib/protect-admin-route";
import prisma from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

function sanitizeOptionalString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET(req: NextRequest, { params }: Params) {
  const guard = protectAdminRoute(req);
  if (guard) return guard;

  try {
    const { id: rawId } = await params;
    const id = rawId?.trim();
    if (!id) {
      return NextResponse.json(
        { error: "ID pesanan tidak valid" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Gagal memuat detail pesanan admin:", error);
    return NextResponse.json(
      { error: "Gagal memuat detail pesanan" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const guard = protectAdminRoute(req);
  if (guard) return guard;

  try {
    const { id: rawId } = await params;
    const id = rawId?.trim();
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
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Payload tidak valid" },
        { status: 400 }
      );
    }

    const status = sanitizeOptionalString((body as Record<string, unknown>).status);
    const customerName = sanitizeOptionalString((body as Record<string, unknown>).customerName);
    const customerPhone = sanitizeOptionalString((body as Record<string, unknown>).customerPhone);
    const note = sanitizeOptionalString((body as Record<string, unknown>).note);

    if (
      status &&
      !["PENDING", "PROCESSED", "DONE", "CANCELLED"].includes(status)
    ) {
      return NextResponse.json(
        { error: "Status tidak valid" },
        { status: 400 }
      );
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        status: status ?? existing.status,
        customerName,
        customerPhone,
        note,
      },
      include: { items: true },
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

export async function DELETE(req: NextRequest, { params }: Params) {
  const guard = protectAdminRoute(req);
  if (guard) return guard;

  try {
    const { id: rawId } = await params;
    const id = rawId?.trim();
    if (!id) {
      return NextResponse.json(
        { error: "ID pesanan tidak valid" },
        { status: 400 }
      );
    }

    const existing = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const restockItems = existing.items.filter((item) => item.foodId);
      if (restockItems.length > 0) {
        await Promise.all(
          restockItems.map((item) =>
            tx.food.update({
              where: { id: item.foodId! },
              data: { stock: { increment: item.quantity } },
            })
          )
        );
      }

      await tx.order.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Gagal menghapus pesanan:", error);
    return NextResponse.json(
      { error: "Gagal menghapus pesanan" },
      { status: 500 }
    );
  }
}
