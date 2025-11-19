'use client';

import { startTransition, useEffect, useMemo, useState } from 'react';

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
});

const whatsappNumber = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP ?? '6287785817414';

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export default function CheckoutPage() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('masakan-bandung-cart');
    startTransition(() => {
      setItems(stored ? JSON.parse(stored) : []);
    });
  }, []);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const message = useMemo(() => {
    if (items.length === 0) {
      return 'Halo! Saya ingin memesan makanan dari Masakan Bandung.';
    }
    const lines = items.map((item) => `- ${item.name} (${item.quantity}x) : ${currency.format(item.price * item.quantity)}`);
    lines.push(`Total: ${currency.format(total)}`);
    lines.push('Nama:');
    lines.push('Alamat:');
    return `Halo! Saya ingin memesan:\n${lines.join('\n')}`;
  }, [items, total]);

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-emerald-600">Checkout</p>
        <h1 className="text-3xl font-bold text-slate-900">Format pesan WhatsApp</h1>
      </div>
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Salin atau langsung kirim format pesan berikut ke admin.</p>
        <textarea value={message} readOnly className="h-48 w-full rounded-2xl border border-slate-200 p-4" />
        <p className="text-lg font-semibold text-slate-900">Total: {currency.format(total)}</p>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="block rounded-full bg-emerald-500 px-4 py-3 text-center font-semibold text-white"
        >
          Buka WhatsApp
        </a>
      </div>
    </div>
  );
}
