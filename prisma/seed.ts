import prisma from '../lib/prisma';
import { hashPassword } from '../lib/auth';

async function main() {
  const categories = [
    { name: 'Seblak' },
    { name: 'Batagor' },
    { name: 'Minuman' }
  ];

  await prisma.category.createMany({ data: categories, skipDuplicates: true });

  const allCategories = await prisma.category.findMany();
  const seblak = allCategories.find((c) => c.name === 'Seblak');
  const batagor = allCategories.find((c) => c.name === 'Batagor');

  await prisma.food.createMany({
    data: [
      {
        name: 'Seblak Ceker',
        price: 25000,
        description: 'Seblak kuah pedas dengan topping ceker empuk.',
        imageUrl: '/placeholder.png',
        categoryId: seblak?.id
      },
      {
        name: 'Batagor Kering',
        price: 18000,
        description: 'Batagor renyah lengkap sambal kacang gurih.',
        imageUrl: '/placeholder.png',
        categoryId: batagor?.id
      }
    ],
    skipDuplicates: true
  });

  const adminPassword = await hashPassword('admin123');
  await prisma.admin.upsert({
    where: { email: 'admin@masakan.id' },
    create: {
      email: 'admin@masakan.id',
      name: 'Super Admin',
      passwordHash: adminPassword
    },
    update: {}
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
