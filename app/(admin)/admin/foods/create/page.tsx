import type { CategoryOption } from "@/app/(admin)/admin/foods/components/FoodForm";
import FoodFormLazy from "@/app/(admin)/admin/foods/components/FoodFormLazy";
import AdminProtected from "@/components/AdminProtected";
import prisma from "@/lib/prisma";

export default async function CreateFoodPage() {
  const categories: CategoryOption[] = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <AdminProtected>
      <div className="space-y-6 p-8">
        <div>
          <p className="text-sm uppercase tracking-wide text-emerald-600">Admin</p>
          <h1 className="text-3xl font-bold text-slate-900">Tambah Makanan</h1>
          <p className="text-sm text-slate-600">Lengkapi data makanan lalu simpan.</p>
        </div>

        <FoodFormLazy categories={categories} />
      </div>
    </AdminProtected>
  );
}
