import express, { Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import logger from "./config/logger";
import TestRouter from "./routes/health.routes";
import { auth } from "./lib/auth";
import { toNodeHandler } from "better-auth/node";

const app: Express = express();

app.use(
  cors({
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(pinoHttp({ logger }));

// Better Auth's handler must be mounted before the body parsers below —
// it reads the raw request body itself. Express 5's router (path-to-regexp
// v7+) requires a named wildcard instead of the bare Express 4 "*".
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", TestRouter);

export { app };