import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const isExternalUrl = process.env.DATABASE_URL?.includes('rlwy.net');

const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: isExternalUrl ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
  allowExitOnIdle: false,
});

// Reconnect on unexpected connection drops
pool.on('error', (err) => {
  console.error('Unexpected error on idle pg client', err);
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
