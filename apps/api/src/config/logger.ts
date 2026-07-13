import pino from "pino";
import { config } from "./index";

const isDevelopment = config.env === "development";

const logger = pino({
  level: config.logLevel,
  base: {
    env: config.env,
    service: "collab-editor-server",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
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
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
});

export default logger;
