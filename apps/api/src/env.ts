import dotenv from "dotenv";
import path from "node:path";

// Read the .env file from the project root and load its values into process.env, so the rest of the app can read them (e.g. process.env.DATABASE_URL).

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

/* 

- Side-effect-only module. Must be imported first because ES module imports are evaluated before other code. 

- This loads environment variables before app, auth, config, and other modules initialize, preventing them from reading an empty or incomplete process.env.

*/