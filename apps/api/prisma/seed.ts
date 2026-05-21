import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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

  // Upsert Basharat (Senior Associate)
  await prisma.user.upsert({
    where: { email: "sbasharat577@gmail.com" },
    update: { role: "SENIOR_ASSOCIATE" },
    create: {
      email: "sbasharat577@gmail.com",
      name: "Basharat",
      passwordHash,
      role: "SENIOR_ASSOCIATE",
    },
  });

  // Upsert Syed Asrar (Senior Associate)
  await prisma.user.upsert({
    where: { email: "itengineer2.gulmarg@khyberhotels.com" },
    update: { role: "SENIOR_ASSOCIATE" },
    create: {
      email: "itengineer2.gulmarg@khyberhotels.com",
      name: "Syed Asrar",
      passwordHash,
      role: "SENIOR_ASSOCIATE",
    },
  });

  // Upsert General Manager (Viewer - Read Only)
  await prisma.user.upsert({
    where: { email: "gm.gulmarg@khyberhotels.com" },
    update: {},
    create: {
      email: "gm.gulmarg@khyberhotels.com",
      name: "Vinit Chhabra",
      passwordHash,
      role: "VIEWER",
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

  // Seed default network devices
  const defaultDevices = [
    { name: "Oracle Opera PMS Core", ip: "10.200.1.10", category: "DATABASE", uptime: "99.98%" },
    { name: "VingCard Key Server", ip: "10.200.1.20", category: "ACCESS_CONTROL", uptime: "99.95%" },
    { name: "Airtel Primary Fiber Gateway", ip: "1.1.1.1", category: "INTERNET", uptime: "99.85%" },
    { name: "IPTV Gateway Server", ip: "10.200.1.30", category: "ENTERTAINMENT", uptime: "100%" }
  ];

  for (const device of defaultDevices) {
    await (prisma as any).networkDevice.upsert({
      where: { ip: device.ip },
      update: { name: device.name, category: device.category, uptime: device.uptime },
      create: device
    });
  }

  console.log("Database seeded successfully with default accounts, checklist items, and core network devices.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
