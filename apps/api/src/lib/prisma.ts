import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Prisma v7 PrismaPg adapter reads SSL from the connection string URL.
// We must append ?sslmode=require to the URL AND set rejectUnauthorized: false
// on the pool so both the adapter and the pool accept Railway's self-signed cert.
const rawUrl = process.env.DATABASE_URL || "";
const baseUrl = rawUrl.split("?")[0];
const connectionString = `${baseUrl}?sslmode=require`;

// Override pg's default SSL cert verification globally
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle pg client", err);
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
