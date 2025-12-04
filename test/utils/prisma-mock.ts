import { vi } from "vitest";

import type { Admin, Food } from "@prisma/client";

export type PrismaMock = ReturnType<typeof createPrismaMock>;

export function createPrismaMock(options?: { foods?: Food[]; admin?: Admin | null }) {
  const foods: Food[] = (options?.foods ?? []).map((food) => ({ ...food }));
  const admin = options?.admin ?? null;

  const findMany = vi.fn(async (args?: any) => {
    if (!args?.where?.id?.in) return foods.filter((food) => !food.deletedAt);
    const ids: string[] = args.where.id.in;
    return foods.filter((food) => ids.includes(food.id) && !food.deletedAt);
  });

  const update = vi.fn(async ({ where, data }: any) => {
    const food = foods.find((item) => item.id === where.id);
    if (!food) throw new Error("Food not found");
    food.stock -= data.stock.decrement;
    return { ...food };
  });

  const orderCreate = vi.fn(async ({ data }: any) => ({
    id: `order-${Math.floor(Math.random() * 10000)}`,
    status: "PENDING",
    ...data,
  }));

  const adminFindFirst = vi.fn(async ({ where }: any) => {
    if (admin && where?.email === admin.email) return admin;
    return null;
  });

  const client = {
    food: { findMany, update },
    order: { create: orderCreate },
    admin: { findFirst: adminFindFirst },
    $transaction: async (callback: any) => callback({ food: { update }, order: { create: orderCreate } }),
  } as any;

  return {
    client,
    food: { findMany, update },
    order: { create: orderCreate },
    admin: { findFirst: adminFindFirst },
    getStock: (id: string) => foods.find((food) => food.id === id)?.stock,
  };
}
