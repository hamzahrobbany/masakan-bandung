import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { aggregateOrderItems } from "@/lib/order-items";
import {
  createOrderRequestSchema,
  orderDetailRequestSchema,
} from "@/schemas/order.schema";
import { validateRequest } from "@/utils/validate-request";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const validation = validateRequest(orderDetailRequestSchema, {
    ids: request.nextUrl.searchParams.get("ids"),
  });

  if (!validation.success) {
    return NextResponse.json(validation.error, { status: 400 });
  }

  const ids = validation.data.ids;

  try {
    const foods = await prisma.food.findMany({
      where: { id: { in: ids }, deletedAt: null },
      select: { id: true, name: true, price: true, stock: true, isAvailable: true },
    });

    if (foods.length === 0) {
      return NextResponse.json({ error: "Menu tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
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
    return NextResponse.json({ error: "Gagal memuat detail menu" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const validation = validateRequest(createOrderRequestSchema, body);

    if (!validation.success) {
      return NextResponse.json(validation.error, { status: 400 });
    }

    const { customerName, customerPhone, note, items } = validation.data;

    const aggregated = aggregateOrderItems(items);

    const foods = await prisma.food.findMany({
      where: {
        id: { in: aggregated.map((item) => item.foodId) },
        deletedAt: null,
      },
      select: { id: true, name: true, price: true, stock: true, isAvailable: true },
    });

    if (foods.length !== aggregated.length) {
      return NextResponse.json({ error: "Ada menu yang tidak ditemukan" }, { status: 404 });
    }

    const foodMap = new Map(foods.map((food) => [food.id, food]));

    for (const item of aggregated) {
      const food = foodMap.get(item.foodId)!;
      if (!food.isAvailable) {
        return NextResponse.json({ error: `${food.name} sedang tidak tersedia` }, { status: 404 });
      }
      if (food.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stok ${food.name} tidak mencukupi. Sisa ${food.stock}` },
          { status: 400 }
        );
      }
    }

    const total = aggregated.reduce((sum, item) => {
      const food = foodMap.get(item.foodId)!;
      return sum + food.price * item.quantity;
    }, 0);

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          customerName,
          customerPhone,
          note,
          total,
          items: {
            create: aggregated.map((item) => {
              const food = foodMap.get(item.foodId)!;
              return {
                foodId: food.id,
                foodName: food.name,
                foodPrice: food.price,
                quantity: item.quantity,
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

    return NextResponse.json({ id: order.id, status: order.status }, { status: 201 });
  } catch (error) {
    console.error("Gagal membuat order:", error);
    return NextResponse.json({ error: "Gagal membuat pesanan" }, { status: 500 });
  }
}
