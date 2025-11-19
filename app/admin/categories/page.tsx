import prisma from '@/lib/prisma';

import AdminCategoriesClient from './AdminCategoriesClient';

export const revalidate = 0;

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
  return <AdminCategoriesClient categories={categories} />;
}
