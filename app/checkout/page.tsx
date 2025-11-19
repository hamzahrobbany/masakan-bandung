'use client';

import { startTransition, useEffect, useMemo, useState } from 'react';

import { buildWhatsAppMessage, buildWhatsAppUrl, CART_STORAGE_KEY, formatCurrency } from '@/lib/utils';

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

const whatsappNumber = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP ?? '6287785817414';

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState<string>('');
  const [lastOrder, setLastOrder] = useState<OrderResponse | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(CART_STORAGE_KEY);
    startTransition(() => {
      setItems(stored ? JSON.parse(stored) : []);
    });
  }, []);

  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  const message = buildWhatsAppMessage(items);
  const whatsappUrl = buildWhatsAppUrl(whatsappNumber, message);

  async function createOrder() {
    setStatus('loading');
    setFeedback('');
    setLastOrder(null);

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: customerName.trim() || null,
        customerPhone: customerPhone.trim() || null,
        note: note.trim() || null,
        items: items.map((item) => ({ foodId: item.id, quantity: item.quantity }))
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStatus('error');
      setFeedback(data?.error ?? 'Gagal membuat pesanan, coba lagi.');
      return;
    }

    setStatus('success');
    setFeedback('Pesanan tersimpan. Admin akan memproses pesanan Anda.');
    setLastOrder({ id: data.id, status: data.status });
  }

  const hasItems = items.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-emerald-600">Checkout</p>
        <h1 className="text-3xl font-bold text-slate-900">Format pesan WhatsApp</h1>
        <p className="text-sm text-slate-600">Bisa checkout tanpa login, dan admin tetap menerima order via WhatsApp.</p>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Salin atau langsung kirim format pesan berikut ke admin.</p>
        <textarea value={message} readOnly className="h-48 w-full rounded-2xl border border-slate-200 p-4" />
        <p className="text-lg font-semibold text-slate-900">Total: {formatCurrency(total)}</p>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="block rounded-full bg-emerald-500 px-4 py-3 text-center font-semibold text-white"
        >
          Buka WhatsApp
        </a>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Buat Order ke Database</h2>
          <p className="text-sm text-slate-600">Opsional, supaya admin bisa melacak status pesanan.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Nama</label>
            <input
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Nama pelanggan"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700">Nomor WhatsApp</label>
            <input
              value={customerPhone}
              onChange={(event) => setCustomerPhone(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="08xxxxxxxxxx"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700">Catatan</label>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Contoh: tanpa pedas"
            rows={3}
          />
        </div>

        <button
          type="button"
          onClick={createOrder}
          disabled={!hasItems || status === 'loading'}
          className="w-full rounded-full bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white disabled:opacity-60"
        >
          {status === 'loading' ? 'Menyimpan...' : 'Simpan order'}
        </button>

        {feedback && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              status === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {feedback}
            {lastOrder && (
              <div className="mt-2 text-xs text-slate-700">
                Kode Pesanan: <strong>{lastOrder.id}</strong> • Status awal: {lastOrder.status}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
