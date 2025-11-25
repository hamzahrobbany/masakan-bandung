'use client';

import { startTransition, useEffect, useMemo, useState } from 'react';

import {
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  formatCurrency,
  isValidWhatsAppNumber,
  normalizeWhatsAppNumber
} from '@/lib/utils';
import { useCart } from '@/components/CartProvider';

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type OrderResponse = {
  id: string;
  status: string;
};

type FoodSummary = {
  id: string;
  name: string;
  price: number;
  stock: number;
  isAvailable: boolean;
};

export default function CheckoutPage() {
  const { items, replaceItems, clearCart } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState<string>('');
  const [lastOrder, setLastOrder] = useState<OrderResponse | null>(null);

  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  const adminWhatsAppEnv = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP;

  const { adminNumber, isAdminNumberValid, adminNumberError } = useMemo(() => {
    if (!adminWhatsAppEnv) {
      const message =
        'NEXT_PUBLIC_ADMIN_WHATSAPP belum disetel. Atur nomor admin untuk mengaktifkan WhatsApp checkout.';
      console.error(message);
      return { adminNumber: '', isAdminNumberValid: false, adminNumberError: message };
    }

    const normalizedAdmin = normalizeWhatsAppNumber(adminWhatsAppEnv);
    const valid = isValidWhatsAppNumber(adminWhatsAppEnv) && Boolean(normalizedAdmin);

    if (!valid) {
      const message = 'Format NEXT_PUBLIC_ADMIN_WHATSAPP tidak valid. Perbarui konfigurasi lingkungan Anda.';
      console.error(message);
      return { adminNumber: '', isAdminNumberValid: false, adminNumberError: message };
    }

    return { adminNumber: normalizedAdmin, isAdminNumberValid: true, adminNumberError: '' };
  }, [adminWhatsAppEnv]);

  useEffect(() => {
    if (adminNumberError && status === 'idle') {
      setStatus('error');
      setFeedback(adminNumberError);
    }
  }, [adminNumberError, status]);

  const normalizedCustomerPhone = useMemo(
    () => normalizeWhatsAppNumber(customerPhone),
    [customerPhone]
  );

  const message = useMemo(
    () =>
      buildWhatsAppMessage(items, {
        customerName: customerName.trim() || null,
        customerPhone: normalizedCustomerPhone || null,
        note: note.trim() || null
      }),
    [customerName, items, normalizedCustomerPhone, note]
  );

  const whatsappUrl = useMemo(() => {
    if (!isAdminNumberValid) return '';
    return buildWhatsAppUrl(adminNumber, message);
  }, [adminNumber, isAdminNumberValid, message]);

  async function synchronizeCartWithBackend(currentItems: CartItem[]) {
    try {
      const ids = Array.from(new Set(currentItems.map((item) => item.id)));
      const params = new URLSearchParams({ ids: ids.join(',') });
      const response = await fetch(`/api/orders?${params.toString()}`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus('error');
        if (response.status === 404) {
          setFeedback(data?.error ?? 'Menu tidak ditemukan.');
        } else {
          setFeedback(data?.error ?? 'Gagal memuat detail menu terbaru.');
        }
        return null;
      }

      const summaries = (data.items as FoodSummary[]) ?? [];
      const summaryMap = new Map(summaries.map((item) => [item.id, item]));

      let changed = false;
      const removedItems: string[] = [];
      const priceChangedItems: string[] = [];
      const quantityAdjustedItems: string[] = [];

      const nextItems: CartItem[] = [];

      for (const item of currentItems) {
        const summary = summaryMap.get(item.id);
        if (!summary || !summary.isAvailable || summary.stock <= 0) {
          changed = true;
          removedItems.push(item.name);
          continue;
        }

        const adjustedQuantity = Math.min(item.quantity, summary.stock);
        if (
          adjustedQuantity !== item.quantity ||
          summary.price !== item.price ||
          summary.name !== item.name
        ) {
          changed = true;
          if (adjustedQuantity !== item.quantity) {
            quantityAdjustedItems.push(summary.name);
          }
          if (summary.price !== item.price) {
            priceChangedItems.push(summary.name);
          }
        }

        nextItems.push({
          ...item,
          name: summary.name,
          price: summary.price,
          quantity: adjustedQuantity,
        });
      }

      if (!nextItems.length) {
        setStatus('error');
        setFeedback('Menu tidak tersedia atau stok habis. Silakan pilih menu lain.');
        replaceItems([]);
        return null;
      }

      if (changed) {
        replaceItems(nextItems);

        const notifications: string[] = [];
        if (removedItems.length) {
          notifications.push(`Beberapa menu habis: ${removedItems.join(', ')}`);
        }
        if (quantityAdjustedItems.length) {
          notifications.push(`Jumlah disesuaikan dengan stok: ${quantityAdjustedItems.join(', ')}`);
        }
        if (priceChangedItems.length) {
          notifications.push(`Harga terbaru berlaku untuk: ${priceChangedItems.join(', ')}`);
        }
        setFeedback(notifications.join(' | ') || 'Keranjang diperbarui dengan data terbaru.');
        setStatus('error');
      }

      return nextItems;
    } catch (error) {
      console.error('Sync cart error:', error);
      setStatus('error');
      setFeedback('Gagal memuat detail terbaru. Periksa koneksi internet Anda.');
      return null;
    }
  }

  async function retrySynchronization() {
    setStatus('loading');
    setFeedback('');

    const syncedItems = await synchronizeCartWithBackend(items);
    if (!syncedItems) return;

    setStatus('idle');
    setFeedback('Keranjang sudah disinkronkan ulang. Silakan lanjutkan checkout.');
  }

  async function createOrder() {
    if (!items.length) {
      setFeedback('Keranjang masih kosong.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setFeedback('');
    setLastOrder(null);

    if (customerPhone.trim() && !isValidWhatsAppNumber(customerPhone)) {
      setStatus('error');
      setFeedback('Nomor WhatsApp tidak valid. Gunakan format 08xxxx atau 62xxxx tanpa spasi.');
      return;
    }

    const syncedItems = await synchronizeCartWithBackend(items);
    if (!syncedItems) {
      return;
    }

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim() || null,
          customerPhone: normalizedCustomerPhone || null,
          note: note.trim() || null,
          items: syncedItems.map((item) => ({ foodId: item.id, quantity: item.quantity }))
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus('error');
        if (response.status === 404) {
          setFeedback(data?.error ?? 'Ada menu yang tidak ditemukan atau stok habis.');
        } else if (response.status >= 500) {
          setFeedback('Server bermasalah. Coba lagi beberapa saat.');
        } else {
          setFeedback(data?.error ?? 'Gagal membuat pesanan, coba lagi.');
        }
        return;
      }

      setStatus('success');
      setFeedback('Pesanan tersimpan. Admin akan memproses pesanan Anda.');
      setLastOrder({ id: data.id, status: data.status });

      clearCart();
    } catch (error) {
      console.error('Order submit error:', error);
      setStatus('error');
      setFeedback('Gagal mengirim pesanan. Periksa koneksi internet Anda.');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-emerald-600">Checkout</p>
        <h1 className="text-3xl font-bold text-slate-900">Selesaikan pesanan</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Detail Pemesan</h2>
            <p className="text-sm text-slate-500">Data ini membantu kami memproses pesanan lebih cepat.</p>
            <div className="mt-4 space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="customerName">Nama</label>
                <input
                  id="customerName"
                  type="text"
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                  placeholder="Nama lengkap"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="customerPhone">Nomor WhatsApp</label>
                <input
                  id="customerPhone"
                  type="tel"
                  value={customerPhone}
                  onChange={(event) => setCustomerPhone(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700" htmlFor="note">Catatan</label>
                <textarea
                  id="note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
                  placeholder="Tanpa pedas, ekstra sambal, dll"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Ringkasan Pesanan</h2>
                <p className="text-sm text-slate-500">Total {items.length} menu, {formatCurrency(total)}.</p>
              </div>
              <button
                type="button"
                onClick={() => startTransition(() => clearCart())}
                className="text-sm font-semibold text-red-500"
              >
                Bersihkan keranjang
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {items.length === 0 && <p className="text-sm text-slate-500">Keranjang kosong.</p>}
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.quantity} x {formatCurrency(item.price)}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          {feedback && (
            <div
              className={`rounded-2xl border p-4 text-sm ${
                status === 'error'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="flex-1">{feedback}</p>
                {status === 'error' && (
                  <button
                    type="button"
                    onClick={retrySynchronization}
                    disabled={status === 'loading' || items.length === 0}
                    className="w-full rounded-full bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                  >
                    Coba lagi
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Pembayaran</h2>
          <p className="text-sm text-slate-500">Periksa kembali pesanan sebelum dikirim.</p>
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Pengiriman</span>
              <span className="text-emerald-600">Hubungi admin</span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold text-slate-900">
              <span>Total Pembayaran</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={createOrder}
              disabled={status === 'loading' || items.length === 0}
              className="w-full rounded-full bg-emerald-500 px-4 py-3 text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {status === 'loading' ? 'Memproses...' : 'Buat Pesanan'}
            </button>
            {isAdminNumberValid ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="block w-full rounded-full border border-emerald-500 px-4 py-3 text-center text-emerald-600 transition hover:bg-emerald-50"
              >
                Tanya admin via WhatsApp
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="block w-full cursor-not-allowed rounded-full border border-emerald-500 px-4 py-3 text-center text-emerald-600 opacity-60"
              >
                Nomor admin belum dikonfigurasi
              </button>
            )}
            {!isAdminNumberValid && (
              <p className="text-xs text-red-600">
                {adminNumberError || 'Nomor admin belum dikonfigurasi. Atur NEXT_PUBLIC_ADMIN_WHATSAPP untuk mengaktifkan tombol WhatsApp.'}
              </p>
            )}
            {lastOrder && (
              <p className="text-xs text-slate-500">
                Pesanan #{lastOrder.id} berhasil disimpan dengan status <span className="font-semibold">{lastOrder.status}</span>.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
