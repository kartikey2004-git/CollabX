import "dotenv/config";
import { Prisma } from "../generated/prisma/client";
import db from "../client";

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

async function main() {
  console.log("Seeding database...");
  await seedUsers();
  console.log("Database seeded successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });