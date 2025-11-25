import { prisma } from '@/lib/prisma';
import HomeContent from '@/components/HomeContent';

export const revalidate = 300;

export default async function HomePage({
  searchParams
}: {
  searchParams?: { category?: string };
}) {
  const selectedCategory = typeof searchParams?.category === 'string' ? searchParams.category : null;

  const [categories, foods] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.food.findMany({
      where: { isAvailable: true, ...(selectedCategory ? { categoryId: selectedCategory } : {}) },
      include: { category: true },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }]
    })
  ]);

  return <HomeContent categories={categories} foods={foods} selectedCategory={selectedCategory} />;
}
