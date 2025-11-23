import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";

export const runtime = "nodejs";

type OrderItemInput = {
  foodId: string;
  quantity: number;
};

function sanitizeOptionalString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function validateItems(raw: unknown): OrderItemInput[] | null {
  if (!Array.isArray(raw) || raw.length === 0) {
    return null;
  }

  const normalized: OrderItemInput[] = [];

  for (const item of raw) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof (item as OrderItemInput).foodId !== "string" ||
      typeof (item as OrderItemInput).quantity !== "number"
    ) {
      return null;
    }

    const foodId = (item as OrderItemInput).foodId.trim();
    const quantity = Math.floor((item as OrderItemInput).quantity);

    if (!foodId || quantity <= 0) {
      return null;
    }

    normalized.push({ foodId, quantity });
  }

  return normalized;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
    }

    const customerName = sanitizeOptionalString((body as Record<string, unknown>).customerName);
    const customerPhone = sanitizeOptionalString((body as Record<string, unknown>).customerPhone);
    const note = sanitizeOptionalString((body as Record<string, unknown>).note);
    const items = validateItems((body as Record<string, unknown>).items);

    if (!items) {
      return NextResponse.json({ error: "Item pesanan tidak valid" }, { status: 400 });
    }

    // Gabungkan item dengan foodId yang sama
    const aggregatedMap = new Map<string, number>();
    for (const item of items) {
      aggregatedMap.set(item.foodId, (aggregatedMap.get(item.foodId) ?? 0) + item.quantity);
    }

    const aggregated = Array.from(aggregatedMap.entries()).map(([foodId, quantity]) => ({
      foodId,
      quantity,
    }));

    const foods = await prisma.food.findMany({
      where: { id: { in: aggregated.map((item) => item.foodId) } },
      select: { id, name: true, price: true, stock: true, isAvailable: true },
    });

    if (foods.length !== aggregated.length) {
      return NextResponse.json({ error: "Ada menu yang tidak ditemukan" }, { status: 400 });
    }

    const foodMap = new Map(foods.map((food) => [food.id, food]));

    for (const item of aggregated) {
      const food = foodMap.get(item.foodId)!;
      if (!food.isAvailable) {
        return NextResponse.json({ error: `${food.name} sedang tidak tersedia` }, { status: 400 });
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
