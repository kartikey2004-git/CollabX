/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client"
import { Pool } from "pg";

declare global {
  var prisma: PrismaClient | undefined;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const isDevelopment = process.env.NODE_ENV === "development";

const db =
  globalThis.prisma ||
  new PrismaClient({
    adapter,
    log: isDevelopment ? ["query", "info", "warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV === "development") {
  globalThis.prisma = db;
}

export default db; 
