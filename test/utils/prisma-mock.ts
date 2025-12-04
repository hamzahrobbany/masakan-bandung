import { vi } from "vitest";

import type { Admin, Food, Prisma, PrismaClient } from "@prisma/client";

export type PrismaMock = ReturnType<typeof createPrismaMock>;

export function createPrismaMock(options?: { foods?: Food[]; admin?: Admin | null }) {
  const foods: Food[] = (options?.foods ?? []).map((food) => ({ ...food }));
  const admin = options?.admin ?? null;

  const findMany = vi.fn(async (args?: Prisma.FoodFindManyArgs) => {
    if (!args?.where?.id?.in) return foods.filter((food) => !food.deletedAt);
    const ids: string[] = args.where.id.in;
    return foods.filter((food) => ids.includes(food.id) && !food.deletedAt);
  });

  const update = vi.fn(async ({ where, data }: Prisma.FoodUpdateArgs) => {
    const food = foods.find((item) => item.id === where.id);
    if (!food) throw new Error("Food not found");
    food.stock -= data.stock!.decrement!;
    return { ...food };
  });

  const orderCreate = vi.fn(async ({ data }: Prisma.OrderCreateArgs) => ({
    id: `order-${Math.floor(Math.random() * 10000)}`,
    status: "PENDING",
    ...data,
  }));

  const adminFindFirst = vi.fn(async ({ where }: Prisma.AdminFindFirstArgs) => {
    if (admin && where?.email === admin.email) return admin;
    return null;
  });

  const transactionClient = {
    food: { update },
    order: { create: orderCreate },
  } as unknown as Prisma.TransactionClient;

  const runTransaction: PrismaClient["$transaction"] = (async (callback: (tx: Prisma.TransactionClient) => unknown) =>
    callback(transactionClient)) as PrismaClient["$transaction"];

  const client: Pick<PrismaClient, "food" | "order" | "admin" | "$transaction"> = {
    food: { findMany, update },
    order: { create: orderCreate },
    admin: { findFirst: adminFindFirst },
    $transaction: runTransaction,
  };

  return {
    client,
    food: { findMany, update },
    order: { create: orderCreate },
    admin: { findFirst: adminFindFirst },
    getStock: (id: string) => foods.find((food) => food.id === id)?.stock,
  };
}
