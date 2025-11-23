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

type FoodSummary = {
  id: string;
  name: string;
  price: number;
  stock: number;
  isAvailable: boolean;
};

export type FoodCardProps = {
  food: {
    id: string;
    name: string;
    price: number;
    description?: string | null;
    imageUrl: string;
    category?: { name: string } | null;
    isAvailable: boolean;
    isFeatured: boolean;
    stock: number;
    rating: number;
  };
};

export default function FoodCard({ food }: FoodCardProps) {
  const handleAddToCart = useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      const params = new URLSearchParams({ ids: food.id });
      const response = await fetch(`/api/orders?${params.toString()}`);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        alert(data?.error ?? 'Menu tidak dapat dimasukkan ke keranjang saat ini.');
        return;
      }

      const summaries = Array.isArray(data.items) ? (data.items as FoodSummary[]) : [];
      const summary = summaries.find((item) => item.id === food.id);
      if (!summary || !summary.isAvailable || summary.stock <= 0) {
        alert('Menu ini sedang tidak tersedia.');
        return;
      }

      const existing = window.localStorage.getItem(CART_STORAGE_KEY);
      const parsed: StoredItem[] = existing ? JSON.parse(existing) : [];
      const index = parsed.findIndex((item) => item.id === food.id);
      const currentQuantity = index > -1 ? parsed[index].quantity : 0;

      if (currentQuantity >= summary.stock) {
        alert(`Stok ${food.name} tersisa ${summary.stock}.`);
        return;
      }

      if (index > -1) {
        parsed[index] = {
          ...parsed[index],
          name: summary.name,
          price: summary.price,
          quantity: parsed[index].quantity + 1,
        };
      } else {
        parsed.push({
          id: food.id,
          name: summary.name,
          price: summary.price,
          imageUrl: food.imageUrl,
          quantity: 1,
        });
      }

      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(parsed));
      alert(`${summary.name} masuk keranjang!`);
    } catch (error) {
      console.error('Add to cart error:', error);
      alert('Gagal memeriksa ketersediaan menu. Coba lagi.');
    }
  }, [food]);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {food.isFeatured && (
          <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white shadow">
            Featured
          </span>
        )}
        {(!food.isAvailable || food.stock <= 0) && (
          <span className="absolute right-3 top-3 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white">
            Habis
          </span>
        )}
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
          <p className="mt-2 text-sm font-semibold text-amber-600">⭐ {food.rating.toFixed(1)}</p>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-base font-semibold text-slate-900">{formatCurrency(food.price)}</span>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!food.isAvailable || food.stock <= 0}
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {food.stock <= 0 || !food.isAvailable ? 'Tidak tersedia' : 'Tambah ke Keranjang'}
          </button>
        </div>
      </div>
    </div>
  );
}
