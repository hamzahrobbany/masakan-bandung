import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.food.deleteMany();
  await prisma.category.deleteMany();
  await prisma.admin.deleteMany();

  const passwordHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.admin.create({
    data: {
      name: "Test Admin",
      email: "admin@masakan.com",
      passwordHash,
    },
  });

  const category = await prisma.category.create({
    data: {
      name: "Masakan Sunda",
      slug: "masakan-sunda",
      createdBy: admin.id,
      updatedBy: admin.id,
    },
  });

  await prisma.food.createMany({
    data: [
      {
        name: "Nasi Timbel",
        price: 25000,
        description: "Paket lengkap",
        imageUrl: "https://picsum.photos/400?1",
        categoryId: category.id,
        stock: 20,
        rating: 5,
        createdBy: admin.id,
        updatedBy: admin.id,
      },
      {
        name: "Sate Maranggi",
        price: 35000,
        description: "Daging empuk",
        imageUrl: "https://picsum.photos/400?2",
        categoryId: category.id,
        stock: 15,
        rating: 4.5,
        isFeatured: true,
        createdBy: admin.id,
        updatedBy: admin.id,
      },
    ],
  });

  console.log("Test database seeded with admin, category, and foods.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
