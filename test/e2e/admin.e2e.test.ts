import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Admin } from "@prisma/client";

import { ADMIN_SESSION_COOKIE } from "@/lib/security";
import { createPrismaMock } from "../utils/prisma-mock";

vi.mock("@/middleware/rate-limit", () => ({
  enforceIpRateLimit: vi.fn(() => Promise.resolve({ limited: false, result: {} })),
}));

beforeEach(() => {
  vi.resetModules();
});

describe("POST /api/admin/login", () => {
  it("sets session cookie on successful login", async () => {
    const adminRecord: Admin = {
      id: "admin-1",
      email: "admin@masakan.com",
      name: "Admin",
      passwordHash: "hashed",
      createdAt: new Date(),
      createdBy: null,
      updatedBy: null,
      deletedAt: null,
    };
    const prismaMock = createPrismaMock({
      admin: adminRecord,
    });

    vi.doMock("@/lib/prisma", () => ({
      __esModule: true,
      default: prismaMock.client,
      prisma: prismaMock.client,
    }));

    vi.doMock("@/lib/auth", async () => {
      const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
      return {
        ...actual,
        verifyPassword: vi.fn().mockResolvedValue(true),
      };
    });

    const { POST } = await import("@/app/api/admin/login/route");

    const request = new NextRequest(new URL("http://localhost/api/admin/login"), {
      method: "POST",
      body: JSON.stringify({
        email: "admin@masakan.com",
        password: "admin123",
        redirect: "/admin/dashboard",
      }),
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "127.0.0.1",
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("http://localhost/admin/dashboard");
    expect(response.cookies.get(ADMIN_SESSION_COOKIE)?.value).toBeTruthy();
  });
});

describe("GET /api/admin/foods", () => {
  it("returns food list for authenticated admin", async () => {
    const prismaMock = createPrismaMock({
      foods: [
        {
          id: "food-a",
          name: "Sate",
          price: 30000,
          stock: 10,
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

    vi.doMock("@/lib/protect-admin-route", () => ({
      protectAdminRoute: () => ({ session: { id: "admin-1", email: "admin@masakan.com" } }),
    }));

    const { GET } = await import("@/app/api/admin/foods/route");

    const request = new NextRequest(new URL("http://localhost/api/admin/foods"));
    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data).toHaveLength(1);
    expect(payload.data[0].name).toBe("Sate");
  });
});
