import db from "@repo/database";
import { auth } from "../lib/auth";

async function main() {
  console.log(" Better Auth Health Check");

  try {
    await db.$connect();
    console.log("Database connected");
  } catch (err) {
    console.error("Database connection failed");
    console.error(err);
    process.exit(1);
  }

  if (auth) {
    console.log("Better Auth initialized");
  } else {
    console.log("Better Auth initialization failed");
  }

  try {
    const count = await db.user.count();

    console.log(`User table accessible`);
    console.log(`Users in database: ${count}`);
  } catch (err) {
    console.error("User table not working");
    console.error(err);
  }

  try {
    const count = await db.session.count();

    console.log(`Session table accessible`);
    console.log(`Sessions: ${count}`);
  } catch (err) {
    console.error("Session table not working");
    console.error(err);
  }

  try {
    const count = await db.account.count();

    console.log(`Account table accessible`);
    console.log(`Accounts: ${count}`);
  } catch (err) {
    console.error("Account table not working");
    console.error(err);
  }

  try {
    const count = await db.verification.count();

    console.log(`Verification table accessible`);
    console.log(`Verifications: ${count}`);
  } catch (err) {
    console.error("Verification table not working");
    console.error(err);
  }

  await db.$disconnect();
  console.log(" Health Check Complete");
}

main();
