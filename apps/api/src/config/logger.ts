import pino from "pino";
import { config } from "./index";

const isDevelopment = config.env === "development";

// Sets up a single shared logger (using the pino library) for the whole app, so every log line has a consistent format instead of using console.log everywhere.

const logger = pino({
  level: config.logLevel,
  base: {
    env: config.env,
    service: "collab-editor-server",
  },
  timestamp: pino.stdTimeFunctions.isoTime, // ISO 8601 format for timestamps in logs
  // Redact/Remove sensitive information from logs
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "body.password",
      "body.token",
      "body.jwt",
      "body.apiKey",
    ],
    remove: true,
  },
  // In development, print logs in a colorized, human-readable format. But In production, leave this undefined so logs are plain JSON (easier for log tools to parse).
  transport: isDevelopment
    ? {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname", // Remove pid(process id) and hostname from logs
      },
    }
    : undefined,
});

export default logger;
