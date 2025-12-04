import { NextRequest, NextResponse } from "next/server";

import { protectAdminRoute } from "@/lib/protect-admin-route";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

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
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Gagal memuat kategori:", error);
    return NextResponse.json(
      { error: "Gagal memuat kategori" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { response, session } = protectAdminRoute(req);
  if (response) return response;

  try {
    const { name } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Nama wajib" }, { status: 400 });
    }

    const slug = await ensureUniqueCategorySlug(name);
    const adminId = session.id;

    const category = await prisma.category.create({
      data: { name, slug, createdBy: adminId, updatedBy: adminId },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Membuat kategori gagal:", error);
    return NextResponse.json({ error: "Gagal membuat kategori" }, { status: 500 });
  }
}
