import { NextRequest } from "next/server";

import { protectAdminRoute } from "@/lib/protect-admin-route";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { createCategoryRequestSchema } from "@/schemas/category.schema";
import { validateRequest } from "@/utils/validate-request";
import { error, success } from "@/utils/response";

export const runtime = "nodejs";

async function ensureUniqueCategorySlug(name: string, excludeId?: string) {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await prisma.category.findFirst({
      where: {
        slug,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (!existing) break;

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export async function GET(req: NextRequest) {
  const { response } = protectAdminRoute(req);
  if (response) return response;

  try {
    const categories = await prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { name: "asc" },
    });
    return success(categories);
  } catch (error) {
    console.error("Gagal memuat kategori:", error);
    return error("CATEGORY_FETCH_FAILED", "Gagal memuat kategori", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { response, session } = protectAdminRoute(req);
  if (response) return response;

  try {
    const body = await req.json().catch(() => null);
    const validation = validateRequest(createCategoryRequestSchema, body);

    if (!validation.success) {
      return error("VALIDATION_ERROR", "Data kategori tidak valid", {
        status: 400,
        details: validation.error,
      });
    }

    const { name } = validation.data;

    const slug = await ensureUniqueCategorySlug(name);
    const adminId = session.id;

    const category = await prisma.category.create({
      data: { name, slug, createdBy: adminId, updatedBy: adminId },
    });

    return success(category, { status: 201 });
  } catch (error) {
    console.error("Membuat kategori gagal:", error);
    return error("CATEGORY_CREATE_FAILED", "Gagal membuat kategori", { status: 500 });
  }
}
