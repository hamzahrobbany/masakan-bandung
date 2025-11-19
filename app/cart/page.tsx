'use client';

import Image from 'next/image';
import Link from 'next/link';
import { startTransition, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type CartItem = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
};

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
});

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('masakan-bandung-cart');
    startTransition(() => {
      setItems(stored ? JSON.parse(stored) : []);
    });
  }, []);

  const persist = (nextItems: CartItem[]) => {
    setItems(nextItems);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('masakan-bandung-cart', JSON.stringify(nextItems));
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    const next = items
      .map((item) => (item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item))
      .filter((item) => item.quantity > 0);
    persist(next);
  };

  const removeItem = (id: string) => {
    persist(items.filter((item) => item.id !== id));
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-emerald-600">Keranjang</p>
        <h1 className="text-3xl font-bold text-slate-900">Pesananmu</h1>
      </div>
      <div className="space-y-4">
        {items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
            Keranjang masih kosong. <Link href="/" className="text-emerald-600">Belanja sekarang</Link>.
          </div>
        )}
        {items.map((item) => (
          <div key={item.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
            <div className="relative h-24 w-24 overflow-hidden rounded-xl">
              <Image src={item.imageUrl || '/placeholder.png'} alt={item.name} fill className="object-cover" sizes="96px" unoptimized />
            </div>
            <div className="flex-1">
              <p className="text-lg font-semibold text-slate-900">{item.name}</p>
              <p className="text-sm text-slate-500">{currency.format(item.price)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="h-8 w-8 rounded-full border border-slate-300 text-lg"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(event) => updateQuantity(item.id, Number(event.target.value))}
                className="w-16 rounded-full border border-slate-300 px-3 py-1 text-center"
              />
              <button
                type="button"
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="h-8 w-8 rounded-full border border-slate-300 text-lg"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="text-sm font-medium text-red-500"
            >
              Hapus
            </button>
          </div>
        ))}
      </div>
      {items.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Total</span>
            <span>{currency.format(total)}</span>
          </div>
          <button
            type="button"
            onClick={() => router.push('/checkout')}
            className="mt-4 w-full rounded-full bg-emerald-500 px-4 py-3 text-white"
          >
            Lanjut ke Checkout
          </button>
        </div>
      )}
    </div>
  );
}
