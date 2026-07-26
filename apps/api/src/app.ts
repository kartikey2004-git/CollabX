import express, { Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import logger from "./config/logger";

import v1Router from "./routes/v1.routes";
import { auth } from "./lib/auth";
import { toNodeHandler } from "better-auth/node";
import { errorMiddleware } from "./middleware/error.middleware";
import HealthRouter from "./routes/health.routes";

const app: Express = express(); // app is the main entry point for the API

// middleware for cross origin resources sharing which configure with origin, credentials , method allows in this server endpoint

/*

Preflight Requests

  - Browser automatically sends an OPTIONS request before complex cross-origin requests to ask "can I do this?"

When it's triggered

  - PUT, DELETE, PATCH, TRACE, CONNECT methods
  - Custom headers (Authorization, X-API-Key, etc.)
  - Content-Type: application/json, application/xml
  - credentials: 'include' (cookies)

No preflight:
   
  - Simple GET, HEAD, POST
  - Only CORS-safe headers
  - Content-Type: form-urlencoded, multipart/form-data, text/plain

First request: OPTIONS + actual request = 2 calls
Subsequent requests within Max-Age: Skip preflight (1 call)
Set maxAge: 86400 for 24-hour caching

*/

app.use(
  cors({
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(pinoHttp({ logger })); // logger middleware

// Better Auth's handler must be mounted before the body parsers below , it reads the raw request body itself. Express 5's router (path-to-regexp v7+) requires a named wildcard instead of the bare Express 4 "*".

app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json()); // Middleware that parses incoming JSON requests and makes the data available in req.body

app.use(express.urlencoded({ extended: true })); // Middleware that parses form-style (non-JSON) request bodies

// Mount our route files onto specific base paths.
app.use("/api", HealthRouter);
app.use("/api/v1", v1Router);

// This must be registered last — Express only treats a 4-argument middleware as an error handler, and it only runs when something calls next(err).

app.use(errorMiddleware);

export { app };