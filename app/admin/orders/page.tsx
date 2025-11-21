// app/admin/orders/page.tsx
"use client";

import { useEffect, useState } from "react";

type OrderItem = {
  id: string;
  foodName: string;
  foodPrice: number;
  quantity: number;
};

type Order = {
  id: string;
  customerName?: string | null;
  customerPhone?: string | null;
  note?: string | null;
  status: "PENDING" | "PROCESSED" | "DONE" | "CANCELLED";
  total: number;
  createdAt: string;
  items: OrderItem[];
};

const STATUS_OPTIONS: Order["status"][] = [
  "PENDING",
  "PROCESSED",
  "DONE",
  "CANCELLED",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadOrders() {
    setLoading(true);
    const res = await fetch("/api/admin/orders");
    setLoading(false);
    const data = await res.json();
    setOrders(data);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function updateStatus(id: string, status: Order["status"]) {
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      alert("Gagal update status");
      return;
    }

    await loadOrders();
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Pesanan</h1>

      <div className="bg-white rounded shadow p-4">
        {loading && (
          <div className="text-sm text-slate-500 mb-2">
            Memuat pesanan...
          </div>
        )}

        {orders.length === 0 && !loading ? (
          <div className="text-sm text-slate-500">
            Belum ada pesanan.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="border rounded p-4 flex flex-col gap-2"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold">
                      {order.customerName || "Tanpa nama"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {order.customerPhone || "-"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">
                      {new Date(order.createdAt).toLocaleString("id-ID")}
                    </div>
                    <div className="font-bold">
                      Rp {order.total.toLocaleString("id-ID")}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  Catatan: {order.note || "-"}
                </div>

                <div className="border-t pt-2 mt-1 text-sm">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-xs py-1"
                    >
                      <span>
                        {item.foodName} x {item.quantity}
                      </span>
                      <span>
                        Rp{" "}
                        {(item.foodPrice * item.quantity).toLocaleString(
                          "id-ID"
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2 border-t mt-2">
                  <div className="text-xs">
                    Status:{" "}
                    <span className="font-semibold">{order.status}</span>
                  </div>
                  <div className="flex gap-2">
                    {STATUS_OPTIONS.map((s) => (
                      <button
                        key={s}
                        disabled={s === order.status}
                        onClick={() => updateStatus(order.id, s)}
                        className={`text-xs px-2 py-1 rounded border ${
                          s === order.status
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
