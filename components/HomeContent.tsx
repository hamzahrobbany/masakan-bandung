'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
  selectedCategory: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
};

export default function HomeContent({ categories, foods, selectedCategory, pagination }: HomeContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleCategoryChange = (categoryId: string) => {
    const params = new URLSearchParams(searchParams);
    const isActive = selectedCategory === categoryId;

    if (isActive) {
      params.delete('category');
    } else {
      params.set('category', categoryId);
    }

    params.delete('page');

    const nextPath = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(nextPath, { scroll: false });
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(page));

    const nextPath = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(nextPath, { scroll: false });
  };

  const totalPages = Math.max(1, Math.ceil(pagination.total / pagination.pageSize));
  const isFirstPage = pagination.page <= 1;
  const isLastPage = pagination.page >= totalPages;
  const pageStart = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const pageEnd = Math.min(pagination.page * pagination.pageSize, pagination.total);

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
                onClick={() => handleCategoryChange(category.id)}
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
                onClick={() => handleCategoryChange(selectedCategory)}
                className="rounded-full border border-emerald-500 px-3 py-1 text-emerald-600 transition hover:bg-emerald-50"
              >
                Tampilkan semua
              </button>
            )}
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {foods.map((food) => (
            <FoodCard key={food.id} food={food} />
          ))}
          {foods.length === 0 && <p className="text-sm text-slate-500">Belum ada makanan di database.</p>}
        </div>
        {pagination.total > pagination.pageSize && (
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Menampilkan {pageStart} - {pageEnd} dari {pagination.total} menu
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={isFirstPage}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50 hover:border-emerald-200 hover:bg-emerald-50"
              >
                Sebelumnya
              </button>
              <div className="flex items-center gap-1 text-sm text-slate-600" aria-live="polite">
                <span className="font-semibold text-slate-900">{pagination.page}</span>
                <span>/</span>
                <span>{totalPages}</span>
              </div>
              <button
                type="button"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={isLastPage}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50 hover:border-emerald-200 hover:bg-emerald-50"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
