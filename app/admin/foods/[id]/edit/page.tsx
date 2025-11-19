"use server";

import { notFound } from 'next/navigation';
import AdminProtected from '@/components/AdminProtected';
import FoodForm from '@/components/FoodForm';
import prisma from '@/lib/prisma';

type EditFoodPageProps = {
  params: { id: string };
};

export default async function EditFoodPage({ params }: EditFoodPageProps) {
  const [food, categories] = await Promise.all([
    prisma.food.findUnique({ where: { id: params.id } }),
    prisma.category.findMany({ orderBy: { name: 'asc' } })
  ]);

  if (!food) notFound();

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
