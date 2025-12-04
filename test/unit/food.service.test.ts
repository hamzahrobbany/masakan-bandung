import { describe, expect, it } from "vitest";

import {
  buildFoodCreateData,
  buildFoodFilters,
  validateFood,
} from "@/domain/foods/service";
import { createFoodRequestSchema } from "@/schemas/food.schema";

const adminId = "admin-1";

const basePayload = {
  name: "Nasi Goreng",
  price: 20000,
  description: "Lezat",
  imageUrl: "https://example.com/nasi.jpg",
  categoryId: "cat-1",
  stock: 3,
  rating: 4.5,
  isFeatured: true,
  isAvailable: true,
};

describe("validateFood", () => {
  it("returns success for valid payload", () => {
    const result = validateFood(basePayload);

    expect(result.success).toBe(true);
  });

  it("returns error for invalid payload", () => {
    const result = validateFood({ name: "", price: -1 });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.error).toBe("Data makanan tidak valid");
      expect(result.error.details?.[0]).toBeDefined();
    }
  });
});

describe("buildFoodCreateData", () => {
  it("applies defaults and preserves provided fields", () => {
    const parsedPayload = createFoodRequestSchema.parse({
      ...basePayload,
      description: undefined,
      imageUrl: "",
      stock: undefined,
      rating: undefined,
      isFeatured: false,
      isAvailable: undefined,
    });
    const data = buildFoodCreateData(parsedPayload, adminId);

    expect(data.description).toBeNull();
    expect(data.imageUrl).toContain("https://picsum.photos/400");
    expect(data.stock).toBe(0);
    expect(data.rating).toBe(5);
    expect(data.isFeatured).toBe(false);
    expect(data.isAvailable).toBe(true);
    expect(data.createdBy).toBe(adminId);
    expect(data.updatedBy).toBe(adminId);
  });
});

describe("buildFoodFilters", () => {
  it("includes search filters and category constraints", () => {
    const filters = buildFoodFilters({
      search: "nasi",
      categoryId: "cat-1",
      isAvailable: true,
      featuredOnly: true,
    });

    expect(filters.deletedAt).toBeNull();
    expect(filters.categoryId).toBe("cat-1");
    expect(filters.isAvailable).toBe(true);
    expect(filters.isFeatured).toBe(true);
    expect(filters.OR).toEqual([
      { name: { contains: "nasi", mode: "insensitive" } },
      { description: { contains: "nasi", mode: "insensitive" } },
    ]);
  });
});
