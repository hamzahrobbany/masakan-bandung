import { Prisma } from "@prisma/client";

import { createFoodRequestSchema } from "@/schemas/food.schema";
import { validateRequest } from "@/utils/validate-request";

type FoodPayload = Omit<
  Prisma.FoodCreateInput,
  "createdAt" | "updatedAt" | "category" | "orderItems"
>;

type FoodFilterInput = {
  search?: string | null;
  categoryId?: string | null;
  isAvailable?: boolean | null;
  featuredOnly?: boolean | null;
};

export function validateFood(body: unknown) {
  return validateRequest(createFoodRequestSchema, body, {
    errorMessage: "Data makanan tidak valid",
  });
}

export function buildFoodCreateData(
  payload: ReturnType<typeof createFoodRequestSchema.parse>,
  adminId: string
): FoodPayload {
  return {
    name: payload.name,
    price: payload.price,
    description: payload.description ?? null,
    imageUrl: payload.imageUrl || "https://picsum.photos/400",
    categoryId: payload.categoryId,
    stock: payload.stock ?? 0,
    rating: payload.rating ?? 5,
    isFeatured: Boolean(payload.isFeatured),
    isAvailable: payload.isAvailable ?? true,
    createdBy: adminId,
    updatedBy: adminId,
  };
}

export function buildFoodFilters(input: FoodFilterInput): Prisma.FoodWhereInput {
  const filters: Prisma.FoodWhereInput = {
    deletedAt: null,
  };

  if (input.categoryId) {
    filters.categoryId = input.categoryId;
  }

  if (typeof input.isAvailable === "boolean") {
    filters.isAvailable = input.isAvailable;
  }

  if (input.featuredOnly) {
    filters.isFeatured = true;
  }

  if (input.search?.trim()) {
    const query = input.search.trim();
    filters.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }

  return filters;
}
