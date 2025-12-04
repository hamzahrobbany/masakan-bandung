// app/api/admin/orders/[id]/route.ts
import { NextRequest } from "next/server";

import type { OrderStatus } from "@prisma/client";

import { protectAdminRoute } from "@/lib/protect-admin-route";
import prisma from "@/lib/prisma";
import {
  NotFoundError,
  ValidationError,
} from "@/utils/api-errors";
import { withErrorHandling } from "@/utils/api-handler";
import { success } from "@/utils/response";

type Params = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

function sanitizeOptionalString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export const GET = withErrorHandling(async (req: NextRequest, { params }: Params) => {
  protectAdminRoute(req);

  const { id: rawId } = await params;
  const id = rawId?.trim();
  if (!id) {
    throw new ValidationError("ID pesanan tidak valid");
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { where: { deletedAt: null } } },
  });

  if (!order || order.deletedAt) {
    throw new NotFoundError("Pesanan tidak ditemukan", { code: "ORDER_NOT_FOUND" });
  }

  return success(order);
});

export const PUT = withErrorHandling(async (req: NextRequest, { params }: Params) => {
  const { session } = protectAdminRoute(req);

  const { id: rawId } = await params;
  const id = rawId?.trim();
  if (!id) {
    throw new ValidationError("ID pesanan tidak valid");
  }

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) {
    throw new NotFoundError("Pesanan tidak ditemukan", { code: "ORDER_NOT_FOUND" });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    throw new ValidationError("Payload tidak valid");
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
    throw new ValidationError("Status tidak valid");
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

  return success(order);
});

export const DELETE = withErrorHandling(
  async (req: NextRequest, { params }: Params) => {
    const { session } = protectAdminRoute(req);

    const { id: rawId } = await params;
    const id = rawId?.trim();
    if (!id) {
      throw new ValidationError("ID pesanan tidak valid");
    }

    const existing = await prisma.order.findUnique({
      where: { id },
      include: { items: { where: { deletedAt: null } } },
    });

    if (!existing || existing.deletedAt) {
      throw new NotFoundError("Pesanan tidak ditemukan", { code: "ORDER_NOT_FOUND" });
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

    return success();
  }
);
