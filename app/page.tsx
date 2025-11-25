import { prisma } from '@/lib/prisma';
import HomeContent from '@/components/HomeContent';

export const revalidate = 300;

export default async function HomePage() {
  const [categories, foods] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.food.findMany({
      where: { isAvailable: true },
      include: { category: true },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }]
    })
  ]);

  return <HomeContent categories={categories} foods={foods} />;
}
