// app/api/admin/orders/route.ts
import { NextRequest } from "next/server";

import { OrderStatus, Prisma } from "@prisma/client";

import { protectAdminRoute } from "@/lib/protect-admin-route";
import prisma from "@/lib/prisma";
import { aggregateOrderItems } from "@/lib/order-items";
import {
  adminOrderQuerySchema,
  adminOrderRequestSchema,
} from "@/schemas/order.schema";
import { validateRequest } from "@/utils/validate-request";
import { success } from "@/utils/response";
import {
  NotFoundError,
  ValidationError,
} from "@/utils/api-errors";
import { withErrorHandling } from "@/utils/api-handler";

export const runtime = "nodejs";

export const GET = withErrorHandling(async (req: NextRequest) => {
  protectAdminRoute(req);

  const validation = validateRequest(adminOrderQuerySchema, {
    search: req.nextUrl.searchParams.get("search"),
    page: req.nextUrl.searchParams.get("page"),
    pageSize: req.nextUrl.searchParams.get("pageSize"),
    status: req.nextUrl.searchParams.get("status"),
  });

  if (!validation.success) {
    throw new ValidationError("Parameter pencarian tidak valid", {
      details: validation.error,
    });
  }

  const { search, page, pageSize, status } = validation.data;

  const where: Prisma.OrderWhereInput = { deletedAt: null };

  if (search) {
    where.OR = [
      {
        customerName: {
          contains: search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
      {
        customerPhone: {
          contains: search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
      {
        note: {
          contains: search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
    ];
  }

  if (status && ["PENDING", "PROCESSED", "DONE", "CANCELLED"].includes(status)) {
    where.status = status as OrderStatus;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      include: { items: { where: { deletedAt: null } } },
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return success({ orders, total, page, pageSize });
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const { session } = protectAdminRoute(req);

  const body = await req.json().catch(() => null);
  const validation = validateRequest(adminOrderRequestSchema, body);

  if (!validation.success) {
    throw new ValidationError("Data pesanan tidak valid", {
      details: validation.error,
    });
  }

  const { customerName, customerPhone, note, items, status } = validation.data;
  const aggregated = aggregateOrderItems(items);

  const foods = await prisma.food.findMany({
    where: {
      id: { in: aggregated.map((item) => item.foodId) },
      deletedAt: null,
    },
    select: { id: true, name: true, price: true, stock: true, isAvailable: true },
  });

  if (foods.length !== aggregated.length) {
    throw new NotFoundError("Ada menu yang tidak ditemukan", { code: "FOOD_NOT_FOUND" });
  }

  const foodMap = new Map(foods.map((food) => [food.id, food]));

  for (const item of aggregated) {
    const food = foodMap.get(item.foodId)!;
    if (!food.isAvailable) {
      throw new NotFoundError(`${food.name} sedang tidak tersedia`, {
        code: "FOOD_UNAVAILABLE",
      });
    }
    if (food.stock < item.quantity) {
      throw new ValidationError(
        `Stok ${food.name} tidak mencukupi. Sisa ${food.stock}`,
        { code: "INSUFFICIENT_STOCK" }
      );
    }
  }

  const total = aggregated.reduce((sum, item) => {
    const food = foodMap.get(item.foodId)!;
    return sum + food.price * item.quantity;
  }, 0);

  const adminId = session.id;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        customerName,
        customerPhone,
        note,
        total,
        status,
        createdBy: adminId,
        updatedBy: adminId,
        items: {
          create: aggregated.map((item) => {
            const food = foodMap.get(item.foodId)!;
            return {
              foodId: food.id,
              foodName: food.name,
              foodPrice: food.price,
              quantity: item.quantity,
              createdBy: adminId,
              updatedBy: adminId,
            };
          }),
        },
      },
    });

    await Promise.all(
      aggregated.map((item) =>
        tx.food.update({
          where: { id: item.foodId },
          data: { stock: { decrement: item.quantity } },
        })
      )
    );

    return created;
  });

  return success({ id: order.id, status: order.status }, { status: 201 });
});
