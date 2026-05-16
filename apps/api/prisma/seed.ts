import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("khyber123!", 10);

  // Upsert Manager
  await prisma.user.upsert({
    where: { email: "itmanager.gulmarg@khyberhotel.com" },
    update: {},
    create: {
      email: "itmanager.gulmarg@khyberhotel.com",
      name: "IT Manager",
      passwordHash,
      role: "MANAGER",
    },
  });

  // Upsert Engineer 1
  await prisma.user.upsert({
    where: { email: "sbahsarat577@gmail.com" },
    update: {},
    create: {
      email: "sbahsarat577@gmail.com",
      name: "Basharat",
      passwordHash,
      role: "ENGINEER",
    },
  });

  // Upsert Engineer 2
  await prisma.user.upsert({
    where: { email: "asrasyed330@gmail.com" },
    update: {},
    create: {
      email: "asrasyed330@gmail.com",
      name: "Asra Syed",
      passwordHash,
      role: "ENGINEER",
    },
  });

  console.log("Database seeded successfully with default accounts (password: khyber123!)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
