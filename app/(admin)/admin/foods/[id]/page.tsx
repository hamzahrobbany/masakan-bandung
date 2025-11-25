import type { FoodFormData } from "@/app/(admin)/admin/foods/components/FoodForm";
import FoodFormLazy from "@/app/(admin)/admin/foods/components/FoodFormLazy";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function EditFoodPage({ params }: { params: { id: string } }) {
  const [categories, food] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.food.findUnique({ where: { id: params.id } }),
  ]);

  if (!food) {
    notFound();
  }

  const initialData: FoodFormData = {
    id: food.id,
    name: food.name,
    price: food.price,
    description: food.description,
    imageUrl: food.imageUrl,
    categoryId: food.categoryId,
    stock: food.stock,
    rating: food.rating,
    isAvailable: food.isAvailable,
    isFeatured: food.isFeatured,
  };

  return (
    <div className="space-y-6 p-8">
      <div>
        <p className="text-sm uppercase tracking-wide text-emerald-600">Admin</p>
        <h1 className="text-3xl font-bold text-slate-900">Edit Makanan</h1>
        <p className="text-sm text-slate-600">Perbarui data makanan berikut kemudian simpan.</p>
      </div>

      <FoodFormLazy categories={categories} initialData={initialData} />
    </div>
  );
}
