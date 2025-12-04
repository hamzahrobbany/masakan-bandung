import { prisma } from '@/lib/prisma';
import HomeContent from '@/components/HomeContent';

export const revalidate = 300;
export const dynamic = 'force-dynamic';

export default async function HomePage({
  searchParams
}: {
  searchParams?: Promise<{ category?: string; page?: string }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const selectedCategory =
    typeof resolvedSearchParams.category === 'string'
      ? resolvedSearchParams.category
      : null;
  const page =
    Number(resolvedSearchParams.page) > 0
      ? Number(resolvedSearchParams.page)
      : 1;
  const pageSize = 12;

  const foodFilter = {
    deletedAt: null,
    isAvailable: true,
    ...(selectedCategory ? { categoryId: selectedCategory } : {})
  } as const;

  const [categories, foodCount] = await Promise.all([
    prisma.category.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } }),
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
