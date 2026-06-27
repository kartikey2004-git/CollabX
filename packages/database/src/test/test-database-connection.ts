import "dotenv/config";
import db from "../client";

async function main() {
  try {
    console.log("Connecting...");

    await db.$connect();

    console.log("Connected");

    const result = await db.$queryRaw`SELECT current_user, current_database()`;

    console.log(result);

    const users = await db.user.findMany();

    console.log(users);
  } catch (e) {
    console.error(e);
  } finally {
    await db.$disconnect();
  }
}

main();