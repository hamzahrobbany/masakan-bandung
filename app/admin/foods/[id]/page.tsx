import { notFound } from 'next/navigation';

import prisma from '@/lib/prisma';

import DetailFoodClient from './DetailFoodClient';

export const revalidate = 0;

type DetailFoodPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DetailFoodPage({ params }: DetailFoodPageProps) {
  const { id } = await params;
  const food = await prisma.food.findUnique({
    where: { id },
    include: { category: true }
  });

  if (!food) {
    notFound();
  }

  return <DetailFoodClient food={food} />;
}
