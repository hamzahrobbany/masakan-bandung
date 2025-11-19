'use client';

import Image from 'next/image';
import { useCallback } from 'react';
import { CART_STORAGE_KEY, formatCurrency } from '@/lib/utils';

type StoredItem = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
};

export type FoodCardProps = {
  food: {
    id: string;
    name: string;
    price: number;
    description?: string | null;
    imageUrl: string;
    category?: { name: string } | null;
  };
};

export default function FoodCard({ food }: FoodCardProps) {
  const handleAddToCart = useCallback(() => {
    if (typeof window === 'undefined') return;
    const existing = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsed: StoredItem[] = existing ? JSON.parse(existing) : [];
    const index = parsed.findIndex((item) => item.id === food.id);
    if (index > -1) {
      parsed[index].quantity += 1;
    } else {
      parsed.push({
        id: food.id,
        name: food.name,
        price: food.price,
        imageUrl: food.imageUrl,
        quantity: 1
      });
    }
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(parsed));
    alert(`${food.name} masuk keranjang!`);
  }, [food]);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <Image
          src={food.imageUrl || '/placeholder.png'}
          alt={food.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
          unoptimized
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-emerald-600">{food.category?.name ?? 'Tanpa Kategori'}</p>
          <h3 className="text-lg font-semibold text-slate-900">{food.name}</h3>
          {food.description && <p className="text-sm text-slate-600">{food.description}</p>}
        </div>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-base font-semibold text-slate-900">{formatCurrency(food.price)}</span>
          <button
            type="button"
            onClick={handleAddToCart}
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            Tambah ke Keranjang
          </button>
        </div>
      </div>
    </div>
  );
}
