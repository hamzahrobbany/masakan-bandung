// app/api/admin/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

import type { OrderStatus } from "@prisma/client";

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
  const { response } = protectAdminRoute(req);
  if (response) return response;

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
      include: { items: { where: { deletedAt: null } } },
    });

    if (!order || order.deletedAt) {
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
  const { response, session } = protectAdminRoute(req);
  if (response) return response;

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
    if (!existing || existing.deletedAt) {
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

    const payload = body as Record<string, unknown>;
    const hasStatus = Object.prototype.hasOwnProperty.call(payload, "status");
    const hasCustomerName = Object.prototype.hasOwnProperty.call(payload, "customerName");
    const hasCustomerPhone = Object.prototype.hasOwnProperty.call(payload, "customerPhone");
    const hasNote = Object.prototype.hasOwnProperty.call(payload, "note");

    const status = hasStatus ? sanitizeOptionalString(payload.status) : null;
    const customerName = hasCustomerName
      ? sanitizeOptionalString(payload.customerName)
      : undefined;
    const customerPhone = hasCustomerPhone
      ? sanitizeOptionalString(payload.customerPhone)
      : undefined;
    const note = hasNote ? sanitizeOptionalString(payload.note) : undefined;

    if (
      status &&
      !["PENDING", "PROCESSED", "DONE", "CANCELLED"].includes(status)
    ) {
      return NextResponse.json(
        { error: "Status tidak valid" },
        { status: 400 }
      );
    }

    const nextStatus: OrderStatus =
      (status as OrderStatus | null) ?? existing.status;

    const data: {
      status: OrderStatus;
      customerName?: string | null;
      customerPhone?: string | null;
      note?: string | null;
      updatedBy?: string | null;
    } = {
      status: nextStatus,
    };

    if (hasCustomerName) data.customerName = customerName ?? null;
    if (hasCustomerPhone) data.customerPhone = customerPhone ?? null;
    if (hasNote) data.note = note ?? null;
    data.updatedBy = session.id;

    const order = await prisma.order.update({
      where: { id },
      data,
      include: { items: { where: { deletedAt: null } } },
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
  const { response, session } = protectAdminRoute(req);
  if (response) return response;

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
      include: { items: { where: { deletedAt: null } } },
    });

    if (!existing || existing.deletedAt) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan" },
        { status: 404 }
      );
    }

    const deletedAt = new Date();

    await prisma.$transaction(async (tx) => {
      const restockItems = existing.items.filter((item) => item.foodId);
      if (restockItems.length > 0) {
        await Promise.all(
          restockItems.map((item) =>
            tx.food.updateMany({
              where: { id: item.foodId!, deletedAt: null },
              data: { stock: { increment: item.quantity } },
            })
          )
        );
      }

      await tx.orderItem.updateMany({
        where: { orderId: id, deletedAt: null },
        data: { deletedAt, updatedBy: session.id },
      });

      await tx.order.update({
        where: { id },
        data: { deletedAt, updatedBy: session.id },
      });
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
