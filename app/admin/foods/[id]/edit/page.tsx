import { notFound } from 'next/navigation';

import AdminProtected from '@/components/AdminProtected';
import FoodForm from '@/components/FoodForm';
import prisma from '@/lib/prisma';

export const revalidate = 0;

type EditFoodPageProps = {
  params: { id: string };
};

export async function loadFoodData(foodId: string) {
  'use server';
  const [food, categories] = await Promise.all([
    prisma.food.findUnique({ where: { id: foodId } }),
    prisma.category.findMany({ orderBy: { name: 'asc' } })
  ]);
  return { food, categories };
}

export default async function EditFoodPage({ params }: EditFoodPageProps) {
  const { food, categories } = await loadFoodData(params.id);

  if (!food) {
    notFound();
  }

  return (
    <AdminProtected>
      <div className="space-y-6">
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
