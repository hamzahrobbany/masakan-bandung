// app/api/admin/foods/route.ts
import { NextRequest } from "next/server";

import { protectAdminRoute } from "@/lib/protect-admin-route";
import prisma from "@/lib/prisma";
import { createFoodRequestSchema } from "@/schemas/food.schema";
import { validateRequest } from "@/utils/validate-request";
import { success } from "@/utils/response";
import {
  NotFoundError,
  ValidationError,
} from "@/utils/api-errors";
import { withErrorHandling } from "@/utils/api-handler";

export const runtime = "nodejs";

export const GET = withErrorHandling(async (req: NextRequest) => {
  protectAdminRoute(req);

  const foods = await prisma.food.findMany({
    where: { deletedAt: null },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  return success(foods);
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const { session } = protectAdminRoute(req);

  const body = await req.json().catch(() => null);
  const validation = validateRequest(createFoodRequestSchema, body);

  if (!validation.success) {
    throw new ValidationError("Data makanan tidak valid", {
      details: validation.error,
    });
  }

  const {
    name,
    price,
    description,
    imageUrl,
    categoryId,
    stock,
    rating,
    isFeatured,
    isAvailable,
  } = validation.data;

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category || category.deletedAt) {
    throw new NotFoundError("Kategori tidak ditemukan", { code: "CATEGORY_NOT_FOUND" });
  }

  const adminId = session.id;

  const food = await prisma.food.create({
    data: {
      name,
      price,
      description: description ?? null,
      imageUrl: imageUrl || "https://picsum.photos/400",
      categoryId,
      stock: stock ?? 0,
      rating: rating ?? 5,
      isFeatured: Boolean(isFeatured),
      isAvailable: isAvailable ?? true,
      createdBy: adminId,
      updatedBy: adminId,
    },
  });

  return success(food, { status: 201 });
});
