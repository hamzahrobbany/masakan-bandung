import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 10);

  await prisma.admin.upsert({
    where: { email: "admin@masakan.com" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@masakan.com",
      passwordHash,
    },
  });

  console.log("Admin default berhasil dibuat:");
  console.log("Email: admin@masakan.com");
  console.log("Password: admin123");
}

main()
  .catch((err) => console.error(err))
  .finally(() => prisma.$disconnect());
