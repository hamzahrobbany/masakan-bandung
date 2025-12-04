import { describe, expect, it, vi } from "vitest";

import {
  calculateTotal,
  checkStock,
  createOrderTransaction,
  reserveStock,
  validateOrder,
} from "@/domain/orders/service";
import type { NormalizedOrderItem } from "@/lib/order-items";

const mockFoods = [
  { id: "food-a", name: "Ayam", price: 15000, stock: 5, isAvailable: true },
  { id: "food-b", name: "Nasi", price: 10000, stock: 10, isAvailable: true },
];

describe("validateOrder", () => {
  it("accepts valid payload and normalizes items", () => {
    const result = validateOrder({
      customerName: "Budi",
      items: [
        { foodId: "food-a", quantity: 1 },
        { foodId: "food-a", quantity: 2 },
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toEqual([
        { foodId: "food-a", quantity: 3 },
      ]);
    }
  });

  it("rejects empty item list", () => {
    const result = validateOrder({ items: [] });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.error).toBe("Payload tidak valid");
    }
  });
});

describe("calculateTotal", () => {
  it("sums quantity times price", () => {
    const foodMap = new Map(mockFoods.map((food) => [food.id, food]));
    const items: NormalizedOrderItem[] = [
      { foodId: "food-a", quantity: 2 },
      { foodId: "food-b", quantity: 3 },
    ];

    expect(calculateTotal(items, foodMap)).toBe(2 * 15000 + 3 * 10000);
  });
});

describe("checkStock", () => {
  it("fails when menu is unavailable", () => {
    const foods = [
      { ...mockFoods[0], isAvailable: false },
    ];
    const items: NormalizedOrderItem[] = [{ foodId: "food-a", quantity: 1 }];

    const result = checkStock(items, foods);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("tidak tersedia");
      expect(result.status).toBe(404);
    }
  });

  it("fails when stock is insufficient", () => {
    const foods = [
      { ...mockFoods[0], stock: 1 },
    ];
    const items: NormalizedOrderItem[] = [{ foodId: "food-a", quantity: 2 }];

    const result = checkStock(items, foods);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Stok");
      expect(result.status).toBe(400);
    }
  });

  it("returns food map when all items valid", () => {
    const items: NormalizedOrderItem[] = [
      { foodId: "food-a", quantity: 2 },
      { foodId: "food-b", quantity: 3 },
    ];

    const result = checkStock(items, mockFoods);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.foodMap.get("food-b")?.price).toBe(10000);
    }
  });
});

describe("reserveStock", () => {
  it("decrements stock for each item", async () => {
    const update = vi.fn();
    const tx = { food: { update } } as unknown as Parameters<typeof reserveStock>[0];

    const items: NormalizedOrderItem[] = [
      { foodId: "food-a", quantity: 2 },
      { foodId: "food-b", quantity: 1 },
    ];

    await reserveStock(tx, items);

    expect(update).toHaveBeenCalledTimes(2);
    expect(update).toHaveBeenCalledWith({
      where: { id: "food-a" },
      data: { stock: { decrement: 2 } },
    });
  });
});

describe("createOrderTransaction", () => {
  it("creates order and reserves stock in a transaction", async () => {
    const createdOrders: any[] = [];
    const update = vi.fn();

    const tx = {
      order: {
        create: vi.fn(async ({ data }) => {
          const order = { id: "order-1", status: "PENDING", ...data };
          createdOrders.push(order);
          return order;
        }),
      },
      food: { update },
    } as any;

    const prismaClient = {
      $transaction: (callback: any) => callback(tx),
    } as any;

    const items: NormalizedOrderItem[] = [
      { foodId: "food-a", quantity: 1 },
    ];
    const foodMap = new Map(mockFoods.map((food) => [food.id, food]));

    const order = await createOrderTransaction(prismaClient, {
      customerName: "Budi",
      customerPhone: "0812",
      note: "", 
      items,
      foodMap,
      total: 15000,
    });

    expect(order.id).toBe("order-1");
    expect(createdOrders).toHaveLength(1);
    expect(update).toHaveBeenCalledOnce();
  });
});
