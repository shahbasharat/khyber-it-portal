import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const dbUrl = process.env.DATABASE_URL || "";

// For Railway's public proxy URL (rlwy.net), SSL is required with self-signed cert
// Append sslmode=require if not already present and using external URL
const isExternalUrl = dbUrl.includes("rlwy.net");
const connectionString = isExternalUrl && !dbUrl.includes("sslmode")
  ? `${dbUrl}?sslmode=require`
  : dbUrl;

const pool = new pg.Pool({
  connectionString,
  ssl: isExternalUrl ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle pg client", err);
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
