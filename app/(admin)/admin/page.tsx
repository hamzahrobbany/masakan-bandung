// app/admin/page.tsx
import prisma from "@/lib/prisma";

export default async function AdminDashboard() {
  const [categoriesCount, foodsCount, ordersCount, pendingOrders] =
    await Promise.all([
      prisma.category.count(),
      prisma.food.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
    ]);

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Admin</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded shadow p-4">
          <div className="text-xs text-slate-500">Kategori</div>
          <div className="text-2xl font-bold">{categoriesCount}</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-xs text-slate-500">Menu Makanan</div>
          <div className="text-2xl font-bold">{foodsCount}</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-xs text-slate-500">Total Pesanan</div>
          <div className="text-2xl font-bold">{ordersCount}</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-xs text-slate-500">Pesanan Pending</div>
          <div className="text-2xl font-bold text-amber-600">
            {pendingOrders}
          </div>
        </div>
      </div>
    </div>
  );
}
