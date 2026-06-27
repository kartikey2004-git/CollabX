// test-pg.ts

import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const result = await pool.query("SELECT current_user,current_database()");
  console.log(result.rows);
}
main();
