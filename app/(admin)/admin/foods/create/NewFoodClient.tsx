'use client';

import type { Category } from '@prisma/client';

import FoodForm from '@/components/FoodForm';

type CategoryOption = Pick<Category, 'id' | 'name'>;

type NewFoodClientProps = {
  categories: CategoryOption[];
};

export default function NewFoodClient({ categories }: NewFoodClientProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-emerald-600">Admin</p>
        <h1 className="text-3xl font-bold text-slate-900">Tambah Makanan</h1>
      </div>
      <FoodForm categories={categories} />
    </div>
  );
}
