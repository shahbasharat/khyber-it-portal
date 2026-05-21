import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

// Strip any query params from the URL — SSL is handled via pool options only
const dbUrl = (process.env.DATABASE_URL || "").split("?")[0];

const pool = new pg.Pool({
  connectionString: dbUrl,
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
