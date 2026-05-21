import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// pg v8 treats sslmode=require as verify-full by default.
// Use uselibpqcompat=true to get standard libpq behavior (no cert verification).
const rawUrl = process.env.DATABASE_URL || "";
const baseUrl = rawUrl.split("?")[0];
const connectionString = `${baseUrl}?sslmode=require&uselibpqcompat=true`;

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
