import { NextRequest, NextResponse } from "next/server";
import { protectAdminRoute } from "@/lib/protect-admin-route";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

export const runtime = "nodejs";

async function ensureUniqueCategorySlug(name: string, excludeId: string) {
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) break;

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = protectAdminRoute(req);
  if (guard) return guard;

  try {
    if (!id) {
      return NextResponse.json({ error: "ID kategori tidak valid" }, { status: 400 });
    }

    const { name } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Nama wajib" }, { status: 400 });
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }

    const slug =
      existing.name === name
        ? existing.slug
        : await ensureUniqueCategorySlug(name, id);

    const updated = await prisma.category.update({
      where: { id },
      data: { name, slug },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update kategori gagal:", error);
    return NextResponse.json({ error: "Gagal memperbarui kategori" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = protectAdminRoute(req);
  if (guard) return guard;

  try {
    if (!id) {
      return NextResponse.json({ error: "ID kategori tidak valid" }, { status: 400 });
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }

    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Gagal menghapus kategori:", error);
    return NextResponse.json(
      { error: "Gagal menghapus kategori" },
      { status: 500 }
    );
  }
}
