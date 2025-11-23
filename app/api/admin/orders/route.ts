// app/api/admin/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { protectAdminRoute } from "@/lib/protect-admin-route";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const guard = protectAdminRoute(req);
  if (guard) return guard;

  try {
    const orders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Gagal memuat pesanan admin:", error);
    return NextResponse.json(
      { error: "Gagal memuat pesanan" },
      { status: 500 }
    );
  }
}
