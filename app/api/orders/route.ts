import { NextRequest } from "next/server";

import {
  calculateTotal,
  checkStock,
  createOrderTransaction,
  validateOrder,
} from "@/domain/orders/service";
import prisma from "@/lib/prisma";
import { orderDetailRequestSchema } from "@/schemas/order.schema";
import { validateRequest } from "@/utils/validate-request";
import { enforceIpRateLimit } from "@/middleware/rate-limit";
import { success } from "@/utils/response";
import {
  NotFoundError,
  ValidationError,
} from "@/utils/api-errors";
import { withErrorHandling } from "@/utils/api-handler";

export const runtime = "nodejs";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const validation = validateRequest(orderDetailRequestSchema, {
    ids: request.nextUrl.searchParams.get("ids"),
  });

  if (!validation.success) {
    throw new ValidationError("Parameter tidak valid", {
      details: validation.error,
    });
  }

  const ids = validation.data.ids;

  const foods = await prisma.food.findMany({
    where: { id: { in: ids }, deletedAt: null },
    select: { id: true, name: true, price: true, stock: true, isAvailable: true },
  });

  if (foods.length === 0) {
    throw new NotFoundError("Menu tidak ditemukan", { code: "MENU_NOT_FOUND" });
  }

  return success({
    items: foods.map((food) => ({
      id: food.id,
      name: food.name,
      price: food.price,
      stock: food.stock,
      isAvailable: food.isAvailable,
    })),
  });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  await enforceIpRateLimit(request, {
    max: 30,
    windowMs: 60 * 60 * 1000,
    route: "/api/orders",
    name: "public-orders",
  });

  const body = await request.json().catch(() => null);
  const validation = validateOrder(body);

  if (!validation.success) {
    throw new ValidationError("Data pesanan tidak valid", {
      details: validation.error,
    });
  }

  const { customerName, customerPhone, note, items } = validation.data;

  const foods = await prisma.food.findMany({
    where: {
      id: { in: items.map((item) => item.foodId) },
      deletedAt: null,
    },
    select: { id: true, name: true, price: true, stock: true, isAvailable: true },
  });

  const stockCheck = checkStock(items, foods);

  if (!stockCheck.success) {
    if (stockCheck.status === 400) {
      throw new ValidationError(stockCheck.error, {
        code: "INSUFFICIENT_STOCK",
      });
    }

    throw new NotFoundError(stockCheck.error, { code: "MENU_NOT_FOUND" });
  }

  const total = calculateTotal(items, stockCheck.foodMap);

  const order = await createOrderTransaction(prisma, {
    customerName,
    customerPhone,
    note,
    items,
    foodMap: stockCheck.foodMap,
    total,
  });

  return success({ id: order.id, status: order.status }, { status: 201 });
});
