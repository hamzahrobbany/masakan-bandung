import { notFound } from 'next/navigation';

import prisma from '@/lib/prisma';

import DetailFoodClient from './DetailFoodClient';

export const revalidate = 0;

type DetailFoodPageProps = {
  params: { id: string };
};

export default async function DetailFoodPage({ params }: DetailFoodPageProps) {
  const food = await prisma.food.findUnique({
    where: { id: params.id },
    include: { category: true }
  });

  if (!food) {
    notFound();
  }

  return <DetailFoodClient food={food} />;
}
