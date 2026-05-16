import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('rlwy.net') ? { rejectUnauthorized: false } : false
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("khyber123!", 10);

  // Upsert Manager
  await prisma.user.upsert({
    where: { email: "itmanager.gulmarg@khyberhotels.com" },
    update: {},
    create: {
      email: "itmanager.gulmarg@khyberhotels.com",
      name: "IT Manager",
      passwordHash,
      role: "MANAGER",
    },
  });

  // Upsert Engineer 1
  await prisma.user.upsert({
    where: { email: "sbasharat577@gmail.com" },
    update: {},
    create: {
      email: "sbasharat577@gmail.com",
      name: "Basharat",
      passwordHash,
      role: "ENGINEER",
    },
  });

  // Upsert Engineer 2
  await prisma.user.upsert({
    where: { email: "itengineer2.gulmarg@khyberhotels.com" },
    update: {},
    create: {
      email: "itengineer2.gulmarg@khyberhotels.com",
      name: "IT Engineer 2",
      passwordHash,
      role: "ENGINEER",
    },
  });

  // Seed Checklist Items
  const checklistItems = [
    { title: "Server Health Check", category: "Servers", order: 1 },
    { title: "Backup Verification", category: "Servers", order: 2 },
    { title: "Internet / WAN Connectivity", category: "Network", order: 3 },
    { title: "Firewall Status", category: "Network", order: 4 },
    { title: "VPN Connectivity", category: "Network", order: 5 },
    { title: "Email Services", category: "Services", order: 6 },
    { title: "Database Connectivity (PMS)", category: "Services", order: 7 },
    { title: "Wi-Fi Access Points", category: "Guest Services", order: 8 },
    { title: "CCTV System Check", category: "Security", order: 9 },
    { title: "PABX / Phone System Check", category: "Communication", order: 10 },
    { title: "PMS Status", category: "Operations", order: 11 },
    { title: "Printer / Peripheral Status", category: "Operations", order: 12 },
  ];

  for (const item of checklistItems) {
    await prisma.checklistItem.upsert({
      where: { id: `item-${item.order}` }, // Using stable IDs for seeding
      update: { title: item.title, category: item.category, order: item.order },
      create: { id: `item-${item.order}`, ...item },
    });
  }

  console.log("Database seeded successfully with default accounts and 12 checklist items.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
