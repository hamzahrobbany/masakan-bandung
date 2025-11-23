import { NextRequest, NextResponse } from "next/server";
import { protectAdminRoute } from "@/lib/protect-admin-route";
import prisma from "@/lib/prisma";

type Params = { params: { id: string } };

export const runtime = "nodejs";

export async function PUT(req: NextRequest, { params }: Params) {
  const guard = protectAdminRoute(req);
  if (guard) return guard;

  const { id } = params;
  const { name } = await req.json();

  const updated = await prisma.category.update({
    where: { id },
    data: { name },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const guard = protectAdminRoute(req);
  if (guard) return guard;

  const { id } = params;

  await prisma.category.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
