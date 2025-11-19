'use client';

import Link from 'next/link';
import type { Category, Food } from '@prisma/client';

import AdminProtected from '@/components/AdminProtected';
import { formatCurrency } from '@/lib/utils';

type FoodWithCategory = Food & { category: Category | null };

type AdminFoodsClientProps = {
  foods: FoodWithCategory[];
};

export default function AdminFoodsClient({ foods }: AdminFoodsClientProps) {
  return (
    <AdminProtected>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-emerald-600">Admin</p>
            <h1 className="text-3xl font-bold text-slate-900">Daftar Makanan</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/foods/new" className="rounded-full bg-emerald-500 px-4 py-2 text-white">
              Tambah Makanan
            </Link>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Nama</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Kategori</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Harga</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {foods.map((food) => (
                <tr key={food.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{food.name}</td>
                  <td className="px-4 py-3 text-slate-500">{food.category?.name ?? 'Tanpa kategori'}</td>
                  <td className="px-4 py-3 text-slate-500">{formatCurrency(food.price)}</td>
                  <td className="px-4 py-3 text-right space-x-3">
                    <Link href={`/admin/foods/${food.id}`} className="text-slate-500 hover:text-slate-900">
                      Detail
                    </Link>
                    <Link href={`/admin/foods/${food.id}/edit`} className="text-emerald-600">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
              {foods.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    Belum ada makanan terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminProtected>
  );
}
