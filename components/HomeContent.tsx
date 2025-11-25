'use client';

import { useMemo, useState } from 'react';
import FoodCard from './FoodCard';

type Category = {
  id: string;
  name: string;
};

type Food = {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  imageUrl: string;
  categoryId: string | null;
  category?: { name: string } | null;
  isAvailable: boolean;
  isFeatured: boolean;
  stock: number;
  rating: number;
};

type HomeContentProps = {
  categories: Category[];
  foods: Food[];
};

export default function HomeContent({ categories, foods }: HomeContentProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredFoods = useMemo(() => {
    if (!selectedCategory) return foods;
    return foods.filter((food) => food.categoryId === selectedCategory);
  }, [foods, selectedCategory]);

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-emerald-600">Kategori</p>
          <h1 className="text-3xl font-bold text-slate-900">Eksplorasi rasa khas Bandung</h1>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const isActive = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(isActive ? null : category.id)}
                className={`rounded-2xl border p-4 text-left shadow-sm transition ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100'
                    : 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                <p className="text-lg font-semibold text-slate-900">{category.name}</p>
                <p className="text-sm text-slate-500">Menu favorit keluarga Bandung.</p>
              </button>
            );
          })}
          {categories.length === 0 && (
            <p className="text-sm text-slate-500">Belum ada kategori yang dibuat.</p>
          )}
        </div>
      </section>
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-emerald-600">Menu</p>
            <h2 className="text-2xl font-semibold text-slate-900">
              {selectedCategory
                ? categories.find((category) => category.id === selectedCategory)?.name ?? 'Semua makanan'
                : 'Semua makanan'}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <p className="hidden md:block">Pilih menu favorit dan tambahkan ke keranjang.</p>
            {selectedCategory && (
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="rounded-full border border-emerald-500 px-3 py-1 text-emerald-600 transition hover:bg-emerald-50"
              >
                Tampilkan semua
              </button>
            )}
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredFoods.map((food) => (
            <FoodCard key={food.id} food={food} />
          ))}
          {filteredFoods.length === 0 && (
            <p className="text-sm text-slate-500">Belum ada makanan di database.</p>
          )}
        </div>
      </section>
    </div>
  );
}
