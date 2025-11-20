// prisma/seed.ts

import prisma from '../lib/prisma';
import { hashPassword } from '../lib/auth.seed';

async function main() {
  const passwordHash = await hashPassword('admin123');

  await prisma.admin.upsert({
    where: { email: 'admin@masakan.id' },
    update: {},
    create: {
      email: 'admin@masakan.id',
      name: 'Super Admin',
      passwordHash,
    },
  });

  console.log('Seeder sukses → admin@masakan.id / admin123');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
