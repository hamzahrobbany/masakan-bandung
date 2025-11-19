'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Category, Food } from '@prisma/client';

import AdminProtected from '@/components/AdminProtected';
import { formatCurrency } from '@/lib/utils';

type FoodWithCategory = Food & { category: Category | null };

type DetailFoodClientProps = {
  food: FoodWithCategory;
};

export default function DetailFoodClient({ food }: DetailFoodClientProps) {
  const updatedAt = new Date(food.updatedAt);

  return (
    <AdminProtected>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-emerald-600">Admin</p>
            <h1 className="text-3xl font-bold text-slate-900">Detail Makanan</h1>
            <p className="text-sm text-slate-500">Terakhir diperbarui {updatedAt.toLocaleDateString('id-ID')}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/admin/foods/${food.id}/edit`} className="rounded-full bg-emerald-500 px-4 py-2 text-white">
              Edit Makanan
            </Link>
            <Link href="/admin/foods" className="rounded-full border border-slate-300 px-4 py-2 text-slate-600">
              Kembali ke daftar
            </Link>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Informasi</h2>
            <dl className="space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <dt className="font-medium text-slate-500">Nama</dt>
                <dd className="text-slate-900">{food.name}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-medium text-slate-500">Kategori</dt>
                <dd className="text-slate-900">{food.category?.name ?? 'Tanpa kategori'}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="font-medium text-slate-500">Harga</dt>
                <dd className="text-slate-900">{formatCurrency(food.price)}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Deskripsi</dt>
                <dd className="mt-1 text-slate-900">{food.description ?? 'Belum ada deskripsi.'}</dd>
              </div>
            </dl>
          </div>
          <div className="relative h-80 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {food.imageUrl ? (
              <Image
                src={food.imageUrl}
                alt={food.name}
                fill
                className="object-cover"
                sizes="(min-width: 768px) 50vw, 100vw"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">Tidak ada gambar</div>
            )}
          </div>
        </div>
      </div>
    </AdminProtected>
  );
}
