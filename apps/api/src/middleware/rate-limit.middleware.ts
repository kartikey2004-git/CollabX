import rateLimit from "express-rate-limit";
import { RedisStore, type RedisReply } from "rate-limit-redis";
import { redis } from "../lib/redis";

// Limits how many "write" requests (POST/PATCH/DELETE) a single client can make per minute, so one user can't spam the API. Counts are kept in Redis (shared across every server instance) rather than in-memory, so the limit holds correctly behind a load balancer and survives a single instance restarting.

function redisStore(prefix: string) {
  return new RedisStore({
    // ioredis's `call(command, ...args)` takes the command name as its first argument, while
    // express-rate-limit's Store passes the whole command (including its name) as one array —
    // split it back apart here. `call`'s return type is wider than RedisReply, but the Lua
    // scripts this store runs only ever return values RedisReply already covers.
    sendCommand: (...args: string[]) => redis.call(args[0]!, ...args.slice(1)) as Promise<RedisReply>,
    prefix,
  });
}

export const mutationRateLimiter = rateLimit({
  windowMs: 60 * 1000, // The time window to count requests in which is 1 minute (window means the time period in which the requests are counted)

  limit: 60, // Max requests allowed per client within that window

  standardHeaders: true, // Enable standard headers (RateLimit, remaining, reset)

  legacyHeaders: false, // Disable legacy headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)

  store: redisStore("rl:mutation:"),

  // What to send back if a client goes over the limit.
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests. Please try again shortly.",
    },
  },
});

// A dedicated rate limit for image uploads. Uploads are more resource-intensive (multipart bodies, an object-storage round trip) than regular JSON requests, so they use a separate limit.

export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 1000, // The time window to count requests in which is 1 minute (window means the time period in which the requests are counted)

  limit: 20, // Max uploads per client per minute

  standardHeaders: true, // Enable standard headers (RateLimit, remaining, reset)

  legacyHeaders: false, // Disable legacy headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)

  store: redisStore("rl:upload:"),

  // What to send back if a client goes over the limit.
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many uploads. Please try again shortly.",
    },
  },
});
