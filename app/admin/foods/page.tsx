import prisma from '@/lib/prisma';

import AdminFoodsClient from './AdminFoodsClient';

export const revalidate = 0;

export default async function AdminFoodsPage() {
  const foods = await prisma.food.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' }
  });

  return <AdminFoodsClient foods={foods} />;
}
