"use client";

import type { Category, Food } from "@prisma/client";

import type {
  CategoryOption,
  FoodFormData,
} from "@/app/(admin)/admin/foods/components/FoodForm";
import FoodFormLazy from "@/app/(admin)/admin/foods/components/FoodFormLazy";

interface EditFoodClientProps {
  food: Food;
  categories: Category[];
}

export default function EditFoodClient({ food, categories }: EditFoodClientProps) {
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

  const categoryOptions: CategoryOption[] = categories.map((category) => ({
    id: category.id,
    name: category.name,
  }));

  return (
    <div className="space-y-6 p-8">
      <div>
        <p className="text-sm uppercase tracking-wide text-emerald-600">Admin</p>
        <h1 className="text-3xl font-bold text-slate-900">Edit Makanan</h1>
        <p className="text-sm text-slate-600">
          Perbarui data makanan berikut kemudian simpan.
        </p>
      </div>

      <FoodFormLazy categories={categoryOptions} initialData={initialData} />
    </div>
  );
}
