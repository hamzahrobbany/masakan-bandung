import { NextRequest } from "next/server";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { createPrismaMock } from "../utils/prisma-mock";

vi.mock("@/middleware/rate-limit", () => ({
  enforceIpRateLimit: vi.fn(() => Promise.resolve({ limited: false, result: {} })),
}));

describe("POST /api/orders", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("creates an order and reserves stock", async () => {
    const prismaMock = createPrismaMock({
      foods: [
        {
          id: "food-a",
          name: "Nasi Goreng",
          price: 20000,
          stock: 5,
          isAvailable: true,
          categoryId: "cat-1",
          description: "",
          imageUrl: "",
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: null,
          updatedBy: null,
          deletedAt: null,
          isFeatured: false,
          rating: 5,
        },
      ],
    });

    vi.doMock("@/lib/prisma", () => ({
      __esModule: true,
      default: prismaMock.client,
      prisma: prismaMock.client,
    }));

    const { POST } = await import("@/app/api/orders/route");

    const request = new NextRequest(new URL("http://localhost/api/orders"), {
      method: "POST",
      body: JSON.stringify({
        customerName: "Budi",
        customerPhone: "0812",
        note: "Pedas", 
        items: [{ foodId: "food-a", quantity: 2 }],
      }),
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "127.0.0.1",
      },
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.success).toBe(true);
    expect(prismaMock.food.update).toHaveBeenCalledWith({
      where: { id: "food-a" },
      data: { stock: { decrement: 2 } },
    });
    expect(prismaMock.getStock("food-a")).toBe(3);
  });
});
