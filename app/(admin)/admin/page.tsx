// app/admin/page.tsx
import prisma from "@/lib/prisma";

export default async function AdminDashboard() {
  const [categoriesCount, foodsCount, ordersCount, pendingOrders, latestOrders] =
    await Promise.all([
      prisma.category.count(),
      prisma.food.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.findMany({
        include: { items: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
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

      <div className="bg-white rounded shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Pesanan Terbaru</h2>
          <a
            href="/admin/orders"
            className="text-sm text-amber-700 hover:text-amber-800"
          >
            Lihat semua
          </a>
        </div>

        {latestOrders.length === 0 ? (
          <div className="text-sm text-slate-500">Belum ada pesanan.</div>
        ) : (
          <div className="divide-y">
            {latestOrders.map((order) => (
              <div key={order.id} className="py-3 flex justify-between gap-4">
                <div className="space-y-1">
                  <div className="font-semibold">
                    {order.customerName || "Tanpa nama"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(order.createdAt).toLocaleString("id-ID")}
                  </div>
                  <div className="text-xs text-slate-600">
                    {order.items
                      .map((item) => `${item.foodName} x ${item.quantity}`)
                      .join(", ") || "Tidak ada item"}
                  </div>
                </div>
                <div className="text-right space-y-1 min-w-[140px]">
                  <div className="text-xs font-semibold text-slate-700">
                    {order.status}
                  </div>
                  <div className="font-bold">
                    Rp {order.total.toLocaleString("id-ID")}
                  </div>
                  <a
                    href={`/admin/orders/${order.id}`}
                    className="text-xs text-amber-700 hover:text-amber-800"
                  >
                    Detail
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
