import { Prisma, PrismaClient } from "@prisma/client";

import { aggregateOrderItems, NormalizedOrderItem } from "@/lib/order-items";
import { createOrderRequestSchema } from "@/schemas/order.schema";
import { validateRequest } from "@/utils/validate-request";

type FoodData = {
  id: string;
  name: string;
  price: number;
  stock: number;
  isAvailable: boolean;
};

export function validateOrder(body: unknown) {
  const validation = validateRequest(createOrderRequestSchema, body);

  if (!validation.success) {
    return { success: false as const, error: validation.error };
  }

  return {
    success: true as const,
    data: {
      ...validation.data,
      items: aggregateOrderItems(validation.data.items),
    },
  };
}

export function calculateTotal(
  items: NormalizedOrderItem[],
  foodMap: Map<string, FoodData>
) {
  return items.reduce((sum, item) => {
    const food = foodMap.get(item.foodId)!;
    return sum + food.price * item.quantity;
  }, 0);
}

export function checkStock(items: NormalizedOrderItem[], foods: FoodData[]) {
  if (foods.length !== items.length) {
    return { success: false as const, status: 404, error: "Ada menu yang tidak ditemukan" };
  }

  const foodMap = new Map(foods.map((food) => [food.id, food]));

  for (const item of items) {
    const food = foodMap.get(item.foodId)!;
    if (!food.isAvailable) {
      return {
        success: false as const,
        status: 404,
        error: `${food.name} sedang tidak tersedia`,
      };
    }
    if (food.stock < item.quantity) {
      return {
        success: false as const,
        status: 400,
        error: `Stok ${food.name} tidak mencukupi. Sisa ${food.stock}`,
      };
    }
  }

  return { success: true as const, foodMap };
}

export async function reserveStock(
  tx: Prisma.TransactionClient,
  items: NormalizedOrderItem[]
) {
  await Promise.all(
    items.map((item) =>
      tx.food.update({
        where: { id: item.foodId },
        data: { stock: { decrement: item.quantity } },
      })
    )
  );
}

export async function createOrderTransaction(
  prismaClient: PrismaClient,
  params: {
    customerName?: string | null;
    customerPhone?: string | null;
    note?: string | null;
    items: NormalizedOrderItem[];
    foodMap: Map<string, FoodData>;
    total: number;
  }
) {
  return prismaClient.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        customerName: params.customerName,
        customerPhone: params.customerPhone,
        note: params.note,
        total: params.total,
        items: {
          create: params.items.map((item) => {
            const food = params.foodMap.get(item.foodId)!;
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

    await reserveStock(tx, params.items);

    return order;
  });
}
