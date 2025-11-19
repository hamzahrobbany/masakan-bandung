import prisma from '@/lib/prisma';

import AdminOrdersClient from './AdminOrdersClient';

export const revalidate = 0;

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: { items: { include: { food: true } } },
    orderBy: { createdAt: 'desc' }
  });

  return <AdminOrdersClient orders={orders} />;
}
