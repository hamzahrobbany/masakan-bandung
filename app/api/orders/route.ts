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
import { error, success } from "@/utils/response";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const validation = validateRequest(orderDetailRequestSchema, {
    ids: request.nextUrl.searchParams.get("ids"),
  });

  if (!validation.success) {
    return error("VALIDATION_ERROR", "Parameter tidak valid", {
      status: 400,
      details: validation.error,
    });
  }

  const ids = validation.data.ids;

  try {
    const foods = await prisma.food.findMany({
      where: { id: { in: ids }, deletedAt: null },
      select: { id: true, name: true, price: true, stock: true, isAvailable: true },
    });

    if (foods.length === 0) {
      return error("MENU_NOT_FOUND", "Menu tidak ditemukan", { status: 404 });
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
  } catch (error) {
    console.error("Gagal mengambil detail order:", error);
    return error("ORDER_DETAIL_FETCH_FAILED", "Gagal memuat detail menu", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const rateLimit = await enforceIpRateLimit(request, {
    max: 30,
    windowMs: 60 * 60 * 1000,
    route: "/api/orders",
    name: "public-orders",
  });

  if (rateLimit.limited) {
    return rateLimit.response;
  }

  try {
    const body = await request.json().catch(() => null);
    const validation = validateOrder(body);

    if (!validation.success) {
      return error("VALIDATION_ERROR", "Data pesanan tidak valid", {
        status: 400,
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
      return error(
        stockCheck.status === 400 ? "INSUFFICIENT_STOCK" : "MENU_NOT_FOUND",
        stockCheck.error,
        { status: stockCheck.status }
      );
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
  } catch (error) {
    console.error("Gagal membuat order:", error);
    return error("ORDER_CREATE_FAILED", "Gagal membuat pesanan", { status: 500 });
  }
}
