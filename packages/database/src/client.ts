/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client"
import { Pool } from "pg";

// Store the Prisma client on the global object to reuse it across hot reloads.
declare global {
  var prisma: PrismaClient | undefined;
}

// A connection pool to Postgres reused across queries instead of opening a new database connection every time.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Tells Prisma to run its queries through our pg connection pool.
const adapter = new PrismaPg(pool);

const isDevelopment = process.env.NODE_ENV === "development";

// In development, Next.js hot-reloads this file on every code change, which would normally create a new PrismaClient (and a new batch of database connections) each time. Reusing `globalThis.prisma` if it already exists avoids leaking connections across reloads.

const db =
  globalThis.prisma ||
  new PrismaClient({
    adapter,
    // Log every query in development for debugging; only log errors in production.
    log: isDevelopment ? ["query", "info", "warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV === "development") {
  globalThis.prisma = db;
}

// The single shared Prisma client every app/service should import and reuse.
export default db;
