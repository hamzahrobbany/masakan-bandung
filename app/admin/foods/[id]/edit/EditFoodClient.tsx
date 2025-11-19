'use client';

import type { Category, Food } from '@prisma/client';

import AdminProtected from '@/components/AdminProtected';
import FoodForm from '@/components/FoodForm';

type EditFoodClientProps = {
  food: Food;
  categories: Pick<Category, 'id' | 'name'>[];
};

export default function EditFoodClient({ food, categories }: EditFoodClientProps) {
  return (
    <AdminProtected>
      <div className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-wide text-emerald-600">Admin</p>
          <h1 className="text-3xl font-bold text-slate-900">Edit Makanan</h1>
        </div>
        <FoodForm
          categories={categories}
          foodId={food.id}
          initialData={{
            name: food.name,
            price: food.price,
            categoryId: food.categoryId,
            description: food.description ?? undefined,
            imageUrl: food.imageUrl
          }}
        />
      </div>
    </AdminProtected>
  );
}
