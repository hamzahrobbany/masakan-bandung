import { prisma } from '@/lib/prisma';
import HomeContent from '@/components/HomeContent';

export const revalidate = 300;

export default async function HomePage({
  searchParams
}: {
  searchParams?: { category?: string; page?: string };
}) {
  const selectedCategory =
    typeof searchParams?.category === 'string' ? searchParams.category : null;
  const page =
    Number(searchParams?.page) > 0 ? Number(searchParams?.page) : 1;
  const pageSize = 12;

  const foodFilter = {
    isAvailable: true,
    ...(selectedCategory ? { categoryId: selectedCategory } : {})
  } as const;

  const [categories, foodCount] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
    prisma.food.count({ where: foodFilter })
  ]);

  const totalPages = Math.max(1, Math.ceil(foodCount / pageSize));
  const currentPage = Math.min(page, totalPages);

  const foods = await prisma.food.findMany({
    where: foodFilter,
    include: { category: true },
    orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    take: pageSize,
    skip: (currentPage - 1) * pageSize
  });

  return (
    <HomeContent
      categories={categories}
      foods={foods}
      selectedCategory={selectedCategory}
      pagination={{
        page: currentPage,
        pageSize,
        total: foodCount
      }}
    />
  );
}
