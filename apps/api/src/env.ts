import dotenv from "dotenv";
import path from "node:path";

// Side-effect-only module. Must be the first import in the entrypoint: ES
// module imports are hoisted above all other statements, so loading env vars
// via a plain statement in server.ts (instead of via an import) let modules
// further down the import graph (app -> auth -> config) evaluate with an
// empty process.env before dotenv ever ran.
dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});
