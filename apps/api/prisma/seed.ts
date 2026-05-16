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
    { title: "Opera E-invoice Interface", category: "Interfaces", order: 1 },
    { title: "POS Interface (Smart Tel)", category: "Interfaces", order: 2 },
    { title: "All in one Interface", category: "Interfaces", order: 3 },
    { title: "EPBAX Interface", category: "Interfaces", order: 4 },
    { title: "Ruckus WIFI Controller Status", category: "Network", order: 5 },
    { title: "Antlabs Gateway", category: "Network", order: 6 },
    { title: "Admin/Dormitory WIFI Status", category: "Network", order: 7 },
    { title: "Sophos Firewall Running", category: "Network", order: 8 },
    { title: "All Servers Running", category: "Servers", order: 9 },
    { title: "Jio ILL Line Status", category: "Connectivity", order: 10 },
    { title: "CNS ILL Line Status", category: "Connectivity", order: 11 },
    { title: "MPLS Jio Online", category: "Connectivity", order: 12 },
    { title: "BSNL ILL", category: "Connectivity", order: 13 },
    { title: "SIP TRUNKS (01954350666 & 01943503222)", category: "Communication", order: 14 },
    { title: "Archive Guest List Sent", category: "Operations", order: 15 },
    { title: "KOT Printers Functioning", category: "Hardware", order: 16 },
    { title: "Hi-Path Working", category: "Communication", order: 17 },
    { title: "Extension Time Synced with System", category: "Systems", order: 18 },
    { title: "My Portal & Onity Working", category: "Systems", order: 19 },
    { title: "Essl Attendance Machine", category: "Hardware", order: 20 },
    { title: "K-Task Tracker Synced", category: "Systems", order: 21 },
    { title: "Wish.net, Web Prolific, Touché, Gofrugal", category: "Interfaces", order: 22 },
    { title: "CCTV Cameras Status", category: "Security", order: 23 },
    { title: "Today's Access codes (Guest Wi-Fi)", category: "Operations", order: 24 },
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
