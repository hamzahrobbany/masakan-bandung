import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";
import { aggregateOrderItems } from "@/lib/order-items";

export const runtime = "nodejs";

type OrderItemInput = {
  foodId: string;
  quantity: number;
};

type CartItemInput = {
  id?: string;
  foodId?: string;
  qty?: number;
  quantity?: number;
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

function validateCartItems(raw: unknown): OrderItemInput[] | null {
  if (!Array.isArray(raw) || raw.length === 0) {
    return null;
  }

  const normalized: OrderItemInput[] = [];

  for (const item of raw) {
    if (!item || typeof item !== "object") {
      return null;
    }

    const cartItem = item as CartItemInput;
    const foodId = (cartItem.foodId ?? cartItem.id ?? "").trim();
    const quantityInput = cartItem.quantity ?? cartItem.qty;
    const quantity = Math.floor(typeof quantityInput === "number" ? quantityInput : 0);

    if (!foodId || quantity <= 0) {
      return null;
    }

    normalized.push({ foodId, quantity });
  }

  return normalized;
}

function extractItems(body: Record<string, unknown>): OrderItemInput[] | null {
  return validateItems(body.items) ?? validateCartItems(body.cartItems) ?? null;
}

export async function GET(request: NextRequest) {
  try {
    const idsParam = request.nextUrl.searchParams.get("ids");
    if (!idsParam) {
      return NextResponse.json({ error: "Parameter ids wajib diisi" }, { status: 400 });
    }

    const ids = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      return NextResponse.json({ error: "Daftar ids tidak valid" }, { status: 400 });
    }

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
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Payload tidak valid" }, { status: 400 });
    }

    const payload = body as Record<string, unknown>;

    const customerName = sanitizeOptionalString(payload.customerName ?? payload.name);
    const customerPhone = sanitizeOptionalString(payload.customerPhone ?? payload.whatsapp);
    const note = sanitizeOptionalString(payload.note);
    const items = extractItems(payload);

    if (!items) {
      return NextResponse.json({ error: "Item pesanan tidak valid" }, { status: 400 });
    }

    // Gabungkan item dengan foodId yang sama
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
