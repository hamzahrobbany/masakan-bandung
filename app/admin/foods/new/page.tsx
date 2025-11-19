import AdminProtected from '@/components/AdminProtected';
import FoodForm from '@/components/FoodForm';
import prisma from '@/lib/prisma';

export const revalidate = 0;

export default async function NewFoodPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  return (
    <AdminProtected>
      <div className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-wide text-emerald-600">Admin</p>
          <h1 className="text-3xl font-bold text-slate-900">Tambah Makanan</h1>
        </div>
        <FoodForm categories={categories} />
      </div>
    </AdminProtected>
  );
}
