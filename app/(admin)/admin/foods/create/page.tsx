import type { CategoryOption } from "@/app/(admin)/admin/foods/components/FoodForm";
import FoodFormLazy from "@/app/(admin)/admin/foods/components/FoodFormLazy";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CreateFoodPage() {
  const categories: CategoryOption[] = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6 p-8">
      <div>
        <p className="text-sm uppercase tracking-wide text-emerald-600">Admin</p>
        <h1 className="text-3xl font-bold text-slate-900">Tambah Makanan</h1>
        <p className="text-sm text-slate-600">Lengkapi data makanan lalu simpan.</p>
      </div>

      <FoodFormLazy categories={categories} />
    </div>
  );
}
