import { NextRequest } from "next/server";

import { protectAdminRoute } from "@/lib/protect-admin-route";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import {
  NotFoundError,
  ValidationError,
} from "@/utils/api-errors";
import { withErrorHandling } from "@/utils/api-handler";
import { success } from "@/utils/response";

export const runtime = "nodejs";

async function ensureUniqueCategorySlug(name: string, excludeId: string) {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await prisma.category.findFirst({
      where: { slug, deletedAt: null, id: { not: excludeId } },
    });
    if (!existing) break;

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export const PUT = withErrorHandling(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const { session } = protectAdminRoute(req);

    if (!id) {
      throw new ValidationError("ID kategori tidak valid");
    }

    const { name } = await req.json();

    if (!name) {
      throw new ValidationError("Nama kategori wajib diisi");
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundError("Kategori tidak ditemukan", { code: "CATEGORY_NOT_FOUND" });
    }

    const slug =
      existing.name === name
        ? existing.slug
        : await ensureUniqueCategorySlug(name, id);

    const updated = await prisma.category.update({
      where: { id },
      data: { name, slug, updatedBy: session.id },
    });

    return success(updated);
  }
);

export const DELETE = withErrorHandling(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const { session } = protectAdminRoute(req);

    if (!id) {
      throw new ValidationError("ID kategori tidak valid");
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundError("Kategori tidak ditemukan", { code: "CATEGORY_NOT_FOUND" });
    }

    await prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), updatedBy: session.id },
    });

    return success();
  }
);
