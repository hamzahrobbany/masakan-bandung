import prisma from '@/lib/prisma';

import NewFoodClient from './NewFoodClient';

export const revalidate = 0;

export default async function NewFoodPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  return <NewFoodClient categories={categories} />;
}
