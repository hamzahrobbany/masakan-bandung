// app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from "next/server";

import { OrderStatus, Prisma } from "@prisma/client";

import { protectAdminRoute } from "@/lib/protect-admin-route";
import prisma from "@/lib/prisma";

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

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const guard = protectAdminRoute(req);
  if (guard) return guard;

  try {
    const search = req.nextUrl.searchParams.get("search")?.trim();
    const page = Math.max(Number(req.nextUrl.searchParams.get("page")) || 1, 1);
    const pageSize = Math.min(
      Math.max(Number(req.nextUrl.searchParams.get("pageSize")) || 10, 1),
      50
    );
    const status = req.nextUrl.searchParams.get("status")?.trim();

    const where: Prisma.OrderWhereInput = {};

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
        include: { items: true },
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({ data: orders, total, page, pageSize });
  } catch (error) {
    console.error("Gagal memuat pesanan admin:", error);
    return NextResponse.json(
      { error: "Gagal memuat pesanan" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const guard = protectAdminRoute(req);
  if (guard) return guard;

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Payload tidak valid" },
        { status: 400 }
      );
    }

    const customerName = sanitizeOptionalString((body as Record<string, unknown>).customerName);
    const customerPhone = sanitizeOptionalString((body as Record<string, unknown>).customerPhone);
    const note = sanitizeOptionalString((body as Record<string, unknown>).note);
    const statusInput = sanitizeOptionalString((body as Record<string, unknown>).status);
    const items = validateItems((body as Record<string, unknown>).items);

    if (!items) {
      return NextResponse.json(
        { error: "Item pesanan tidak valid" },
        { status: 400 }
      );
    }

    const status: OrderStatus =
      (statusInput as OrderStatus | null) ?? OrderStatus.PENDING;
    const validStatuses: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.PROCESSED,
      OrderStatus.DONE,
      OrderStatus.CANCELLED,
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Status tidak valid" },
        { status: 400 }
      );
    }

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
      select: { id: true, name: true, price: true, stock: true, isAvailable: true },
    });

    if (foods.length !== aggregated.length) {
      return NextResponse.json(
        { error: "Ada menu yang tidak ditemukan" },
        { status: 404 }
      );
    }

    const foodMap = new Map(foods.map((food) => [food.id, food]));

    for (const item of aggregated) {
      const food = foodMap.get(item.foodId)!;
      if (!food.isAvailable) {
        return NextResponse.json(
          { error: `${food.name} sedang tidak tersedia` },
          { status: 404 }
        );
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
          status,
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
    console.error("Gagal membuat pesanan admin:", error);
    return NextResponse.json(
      { error: "Gagal membuat pesanan" },
      { status: 500 }
    );
  }
}
