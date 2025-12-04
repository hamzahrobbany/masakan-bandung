'use client';

import { startTransition, useEffect, useMemo, useState } from 'react';

import { formatCurrency, isValidWhatsAppNumber, normalizeWhatsAppNumber } from '@/lib/utils';
import { useCart } from '@/components/CartProvider';

type CartItem = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
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

type ApiResponse<T> =
  | { success: true; data?: T }
  | { success: false; error?: { message?: string } };

function buildAdminCheckoutMessage({
  cartItems,
  totalPrice,
  name,
  whatsapp,
  note,
}: {
  cartItems: CartItem[];
  totalPrice: number;
  name: string;
  whatsapp: string;
  note: string;
}) {
  const safeName = name.trim() || '-';
  const safeWhatsApp = whatsapp.trim() || '-';
  const safeNote = note.trim() || '-';

  const lines = [
    '-------------------------------------------------',
    'Halo admin, saya ingin memesan:',
    '',
    `Nama: ${safeName}`,
    `WhatsApp: ${safeWhatsApp}`,
    `Catatan: ${safeNote}`,
    '',
    `Total Pembayaran: ${formatCurrency(totalPrice)}`,
    '',
    'Rincian Pesanan:',
    ...cartItems.map((item) => `- ${item.name} x${item.quantity} = ${formatCurrency(item.price * item.quantity)}`),
    '-------------------------------------------------',
  ];

  return lines.join('\n');
}

const ADMIN_WHATSAPP_NUMBER = '6281234567890';

export default function CheckoutPage() {
  const { items, replaceItems, clearCart } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState<string>('');
  const [lastOrder, setLastOrder] = useState<OrderResponse | null>(null);

  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  const isRetryDisabled = status === 'loading' || items.length === 0;

  const adminWhatsAppEnv = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || ADMIN_WHATSAPP_NUMBER;

  const { adminNumber, isAdminNumberValid, adminNumberError } = useMemo(() => {
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

  async function synchronizeCartWithBackend(currentItems: CartItem[]) {
    try {
      const ids = Array.from(new Set(currentItems.map((item) => item.id)));
      const params = new URLSearchParams({ ids: ids.join(',') });
      const response = await fetch(`/api/orders?${params.toString()}`);
      const payload = (await response.json().catch(() => null)) as
        | ApiResponse<{ items: FoodSummary[] }>
        | null;

      if (!response.ok || !payload?.success || !payload.data?.items) {
        setStatus('error');
        const errorMessage =
          response.status === 404
            ? 'Menu tidak ditemukan.'
            : 'Gagal memuat detail menu terbaru.';
        setFeedback(errorMessage);
        return null;
      }

      const summaries = payload.data.items;
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

  async function handleCheckout() {
    if (!items.length) {
      setFeedback('Keranjang masih kosong.');
      setStatus('error');
      return;
    }

    if (!isAdminNumberValid) {
      setStatus('error');
      setFeedback('Nomor WhatsApp admin tidak valid. Perbarui konfigurasi dan coba lagi.');
      return;
    }

    if (customerPhone.trim() && !isValidWhatsAppNumber(customerPhone)) {
      setStatus('error');
      setFeedback('Nomor WhatsApp tidak valid. Gunakan format 08xxxx atau 62xxxx tanpa spasi.');
      return;
    }

    setStatus('loading');
    setFeedback('');
    setLastOrder(null);

    const syncedItems = await synchronizeCartWithBackend(items);
    if (!syncedItems) {
      return;
    }

    const latestTotal = syncedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    try {
      const cartItemsPayload = syncedItems.map((item) => ({
        foodId: item.id,
        quantity: item.quantity,
      }));

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim() || undefined,
          customerPhone: normalizedCustomerPhone || undefined,
          note: note.trim() || undefined,
          cartItems: cartItemsPayload,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | ApiResponse<OrderResponse>
        | null;

      if (!response.ok || !payload?.success || !payload.data) {
        setStatus('error');
        const apiMessage =
          (!payload?.success && payload?.error?.message) ?? undefined;
        if (response.status === 404) {
          setFeedback(apiMessage ?? 'Ada menu yang tidak ditemukan atau stok habis.');
        } else if (response.status >= 500) {
          setFeedback('Server bermasalah. Coba lagi beberapa saat.');
        } else {
          setFeedback(apiMessage ?? 'Gagal membuat pesanan, coba lagi.');
        }
        return;
      }

      const message = buildAdminCheckoutMessage({
        cartItems: syncedItems,
        totalPrice: latestTotal,
        name: customerName,
        whatsapp: normalizedCustomerPhone || customerPhone,
        note,
      });

      const whatsappUrl = `https://wa.me/${adminNumber}?text=${encodeURIComponent(message)}`;

      setStatus('success');
      setFeedback('Pesanan tersimpan. Kami membuka WhatsApp untuk melanjutkan konfirmasi.');
      setLastOrder(payload.data);
      clearCart();

      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
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
                    disabled={isRetryDisabled}
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
              onClick={handleCheckout}
              disabled={status === 'loading' || items.length === 0 || !isAdminNumberValid}
              className="w-full rounded-full bg-emerald-500 px-4 py-3 text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {status === 'loading' ? 'Memproses...' : 'Checkout & Kirim WhatsApp'}
            </button>
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
