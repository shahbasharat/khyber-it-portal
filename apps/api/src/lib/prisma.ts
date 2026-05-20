import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const dbUrl = process.env.DATABASE_URL || "";

// Add sslmode=no-verify via URL so the PrismaPg driver adapter correctly
// picks up SSL configuration. Railway's postgres-ssl:18 uses a self-signed cert.
let connectionString = dbUrl;
try {
  const url = new URL(dbUrl);
  url.searchParams.set("sslmode", "no-verify");
  connectionString = url.toString();
} catch {
  connectionString = dbUrl;
}

const pool = new pg.Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle pg client", err);
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
