import FoodCard from '@/components/FoodCard';
import prisma from '@/lib/prisma';

export default async function HomePage() {
  const [categories, foods] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.food.findMany({ include: { category: true }, orderBy: { createdAt: 'desc' } })
  ]);

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-emerald-600">Kategori</p>
          <h1 className="text-3xl font-bold text-slate-900">Eksplorasi rasa khas Bandung</h1>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <div key={category.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-lg font-semibold text-slate-900">{category.name}</p>
              <p className="text-sm text-slate-500">Menu favorit keluarga Bandung.</p>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-slate-500">Belum ada kategori yang dibuat.</p>
          )}
        </div>
      </section>
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-wide text-emerald-600">Menu</p>
            <h2 className="text-2xl font-semibold text-slate-900">Semua makanan</h2>
          </div>
          <p className="text-sm text-slate-500">Pilih menu favorit dan tambahkan ke keranjang.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {foods.map((food) => (
            <FoodCard key={food.id} food={food} />
          ))}
          {foods.length === 0 && (
            <p className="text-sm text-slate-500">Belum ada makanan di database.</p>
          )}
        </div>
      </section>
    </div>
  );
}
