import { NextRequest } from "next/server";

import { protectAdminRoute } from "@/lib/protect-admin-route";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { createCategoryRequestSchema } from "@/schemas/category.schema";
import { validateRequest } from "@/utils/validate-request";
import { success } from "@/utils/response";
import { ValidationError } from "@/utils/api-errors";
import { withErrorHandling } from "@/utils/api-handler";

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

export const GET = withErrorHandling(async (req: NextRequest) => {
  protectAdminRoute(req);

  const categories = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });
  return success(categories);
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const { session } = protectAdminRoute(req);

  const body = await req.json().catch(() => null);
  const validation = validateRequest(createCategoryRequestSchema, body);

  if (!validation.success) {
    throw new ValidationError("Data kategori tidak valid", {
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
});
