import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const dbUrl = process.env.DATABASE_URL || "";

// Railway's public proxy always requires SSL with self-signed cert.
// Strip any existing sslmode params and force the correct config via pool options.
const cleanUrl = dbUrl.split("?")[0];

// Railway uses postgres-ssl:18 image which requires SSL on BOTH internal and external connections.
// Always use SSL with rejectUnauthorized: false to support self-signed certs.
const pool = new pg.Pool({
  connectionString: cleanUrl,
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
