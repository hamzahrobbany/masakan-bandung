import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, { params }: any) {
  const { id } = params;
  const { name } = await req.json();

  const updated = await prisma.category.update({
    where: { id },
    data: { name },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: any) {
  const { id } = params;

  await prisma.category.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
