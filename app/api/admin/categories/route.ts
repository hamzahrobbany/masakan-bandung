import { NextRequest, NextResponse } from "next/server";
import { protectAdminRoute } from "@/lib/protect-admin-route";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

export const runtime = "nodejs";

async function ensureUniqueCategorySlug(name: string) {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing) break;

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export async function GET(req: NextRequest) {
  const guard = protectAdminRoute(req);
  if (guard) return guard;

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const guard = protectAdminRoute(req);
  if (guard) return guard;

  try {
    const { name } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Nama wajib" }, { status: 400 });
    }

    const slug = await ensureUniqueCategorySlug(name);

    const category = await prisma.category.create({
      data: { name, slug },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Membuat kategori gagal:", error);
    return NextResponse.json({ error: "Gagal membuat kategori" }, { status: 500 });
  }
}
