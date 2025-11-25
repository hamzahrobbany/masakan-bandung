import { notFound } from 'next/navigation';

import { prisma } from '@/lib/prisma';


import EditFoodClient from './EditFoodClient';

export const revalidate = 0;

type EditFoodPageProps = {
  params: Promise<{ id: string }>;
};

async function loadFoodData(foodId: string) {
  'use server';
  const [food, categories] = await Promise.all([
    prisma.food.findUnique({ where: { id: foodId } }),
    prisma.category.findMany({ orderBy: { name: 'asc' } })
  ]);
  return { food, categories };
}

export default async function EditFoodPage({ params }: EditFoodPageProps) {
  const { id } = await params;
  const { food, categories } = await loadFoodData(id);

  if (!food) {
    notFound();
  }

  return <EditFoodClient food={food} categories={categories} />;
}
