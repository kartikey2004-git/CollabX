// A script (run manually, not part of the app) that fills the database with some sample data, useful for local development and testing.

import "dotenv/config";
import { Prisma } from "../lib/generated/prisma/client";
import db from "../lib/db";

// The sample users to insert.
const users: Prisma.UserCreateInput[] = [
  {
    name: "Jack",
    email: "jack@example.com",
  },
  {
    name: "Bob the Builder",
    email: "bob@example.com",
  },
];

// Inserts each sample user, or updates them if a user with that email already exists — so running this script multiple times is safe.

async function seedUsers() {
  await Promise.all(
    users.map((user) =>
      db.user.upsert({
        where: {
          email: user.email,
        },
        update: {
          name: user.name,
        },
        create: user,
      })
    )
  );
}

// Entry point: runs all the seed steps in order (just users, for now).
async function main() {
  console.log("Seeding database...");
  await seedUsers();
  console.log("Database seeded successfully.");
}

main()
  .catch((error) => {
    // If anything fails, log it and exit with a non-zero code so CI/scripts notice.
    console.error("Seed failed");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    // Always close the database connection when the script is done, success or not.
    await db.$disconnect();
  });