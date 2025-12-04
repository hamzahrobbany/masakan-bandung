// app/api/admin/foods/[id]/route.ts
import { NextRequest } from "next/server";

import { protectAdminRoute } from "@/lib/protect-admin-route";
import prisma from "@/lib/prisma";
import {
  NotFoundError,
  ValidationError,
} from "@/utils/api-errors";
import { withErrorHandling } from "@/utils/api-handler";
import { success } from "@/utils/response";

type FoodUpdatePayload = {
  name?: string;
  price?: number;
  description?: string | null;
  imageUrl?: string;
  categoryId?: string;
  isAvailable?: boolean;
  stock?: number;
  rating?: number;
  isFeatured?: boolean;
  updatedBy?: string;
};

export const runtime = "nodejs";

export const PUT = withErrorHandling(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const { session } = protectAdminRoute(req);

    if (!id) {
      throw new ValidationError("ID makanan tidak valid");
    }

    const existing = await prisma.food.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundError("Makanan tidak ditemukan", { code: "FOOD_NOT_FOUND" });
    }

    const body = (await req.json()) as FoodUpdatePayload;

    const data: FoodUpdatePayload & { updatedBy?: string } = {};

    if (typeof body.name === "string") data.name = body.name;
    if (typeof body.price === "number") {
      if (body.price < 0) {
        throw new ValidationError("Harga tidak boleh negatif");
      }
      data.price = body.price;
    }
    if (typeof body.description === "string" || body.description === null)
      data.description = body.description;
    if (typeof body.imageUrl === "string") data.imageUrl = body.imageUrl;
    if (typeof body.categoryId === "string") data.categoryId = body.categoryId;
    if (typeof body.isAvailable === "boolean")
      data.isAvailable = body.isAvailable;
    if (typeof body.stock === "number") {
      if (body.stock < 0) {
        throw new ValidationError("Stok tidak boleh negatif");
      }
      data.stock = body.stock;
    }
    if (typeof body.rating === "number") {
      if (body.rating < 0 || body.rating > 5) {
        throw new ValidationError("Rating harus di antara 0 hingga 5");
      }
      data.rating = body.rating;
    }
    if (typeof body.isFeatured === "boolean") data.isFeatured = body.isFeatured;

    if (data.categoryId) {
      const targetCategory = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!targetCategory || targetCategory.deletedAt) {
        throw new NotFoundError("Kategori tidak ditemukan", { code: "CATEGORY_NOT_FOUND" });
      }
    }

    data.updatedBy = session.id;

    const food = await prisma.food.update({
      where: { id },
      data,
    });

    return success(food);
  }
);

export const DELETE = withErrorHandling(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const { session } = protectAdminRoute(req);

    if (!id) {
      throw new ValidationError("ID makanan tidak valid");
    }

    const existing = await prisma.food.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundError("Makanan tidak ditemukan", { code: "FOOD_NOT_FOUND" });
    }

    await prisma.food.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: session.id },
    });
    return success();
  }
);
