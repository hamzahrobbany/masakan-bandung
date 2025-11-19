'use client';

import { useMemo, useState } from 'react';
import type { Food, Order, OrderItem, OrderStatus } from '@prisma/client';

import AdminProtected from '@/components/AdminProtected';
import { readAdminToken } from '@/lib/admin-token';
import { ADMIN_TOKEN_HEADER } from '@/lib/security';
import { formatCurrency } from '@/lib/utils';

type OrderWithItems = Order & { items: (OrderItem & { food: Food | null })[] };

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'PENDING',
  PROCESSED: 'PROCESSED',
  DONE: 'DONE',
  CANCELLED: 'CANCELLED'
};

const STATUS_CLASS: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  PROCESSED: 'bg-blue-100 text-blue-800',
  DONE: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-slate-100 text-slate-800'
};

const ORDER_FLOW: OrderStatus[] = ['PENDING', 'PROCESSED', 'DONE', 'CANCELLED'];

export default function AdminOrdersClient({ orders }: { orders: OrderWithItems[] }) {
  const [items, setItems] = useState<OrderWithItems[]>(orders);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');

  const adminToken = readAdminToken();

  const groupedOrders = useMemo(() => {
    return ORDER_FLOW.map((status) => ({
      status,
      entries: items.filter((order) => order.status === status)
    }));
  }, [items]);

  async function updateStatus(orderId: string, status: OrderStatus) {
    setMessage('');
    setLoadingId(orderId);

    const response = await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(adminToken ? { [ADMIN_TOKEN_HEADER]: adminToken } : {})
      },
      body: JSON.stringify({ status })
    });

    const data = await response.json().catch(() => ({}));
    setLoadingId(null);

    if (!response.ok) {
      setMessage(data?.error ?? 'Gagal memperbarui status');
      return;
    }

    setItems((prev) => prev.map((order) => (order.id === orderId ? { ...order, status } : order)));
    setMessage('Status pesanan diperbarui');
  }

  async function deleteOrder(orderId: string) {
    setMessage('');
    setLoadingId(orderId);

    const response = await fetch(`/api/orders/${orderId}`, {
      method: 'DELETE',
      headers: adminToken ? { [ADMIN_TOKEN_HEADER]: adminToken } : undefined
    });

    const data = await response.json().catch(() => ({}));
    setLoadingId(null);

    if (!response.ok) {
      setMessage(data?.error ?? 'Gagal menghapus pesanan');
      return;
    }

    setItems((prev) => prev.filter((order) => order.id !== orderId));
    setMessage('Pesanan dihapus');
  }

  return (
    <AdminProtected>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-emerald-600">Admin</p>
            <h1 className="text-3xl font-bold text-slate-900">Daftar Pesanan</h1>
            <p className="text-sm text-slate-600">Pantau status checkout pelanggan</p>
          </div>
          {message && <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">{message}</div>}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {groupedOrders.map(({ status, entries }) => (
            <div key={status} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLASS[status]}`}>
                  {STATUS_LABEL[status]}
                </div>
                <span className="text-xs text-slate-500">{entries.length} pesanan</span>
              </div>
              <div className="space-y-3">
                {entries.map((order) => (
                  <div key={order.id} className="rounded-xl border border-slate-100 p-4 shadow-sm">
                    <div className="flex flex-wrap justify-between gap-2 text-sm text-slate-600">
                      <span>ID: {order.id}</span>
                      <span>{new Date(order.createdAt).toLocaleString('id-ID')}</span>
                    </div>
                    <p className="text-lg font-semibold text-slate-900">Total {formatCurrency(order.total)}</p>
                    <p className="text-sm text-slate-600">
                      {order.customerName || 'Pelanggan'} {order.customerPhone ? `• ${order.customerPhone}` : ''}
                    </p>
                    {order.note && <p className="text-sm text-slate-600">Catatan: {order.note}</p>}

                    <div className="mt-2 space-y-1 text-sm text-slate-700">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between">
                          <span>
                            {item.foodName} x{item.quantity}
                            {item.food?.name && item.food?.name !== item.foodName ? ` (${item.food.name})` : ''}
                          </span>
                          <span>{formatCurrency(item.foodPrice * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-sm">
                      {ORDER_FLOW.map((target) => (
                        <button
                          key={target}
                          type="button"
                          onClick={() => updateStatus(order.id, target)}
                          className={`rounded-full border px-3 py-1 ${
                            order.status === target
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-slate-200 text-slate-600'
                          }`}
                          disabled={loadingId === order.id}
                        >
                          {STATUS_LABEL[target]}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => deleteOrder(order.id)}
                        className="rounded-full border border-rose-200 px-3 py-1 text-rose-600"
                        disabled={loadingId === order.id}
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
                {entries.length === 0 && <p className="text-sm text-slate-500">Belum ada pesanan.</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminProtected>
  );
}
