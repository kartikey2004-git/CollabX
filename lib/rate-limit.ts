import { redis } from "./redis";
import { RateLimitedError } from "./errors";

// Replaces apps/api's rate-limit.middleware.ts. `express-rate-limit` + `rate-limit-redis` are
// Express-specific (they wrap Express's middleware signature and a `Store` interface built around
// it) — Route Handlers have no such middleware chain, so this reimplements the same two limits
// (60/min for mutations, 20/min for uploads) as a plain Redis fixed-window counter: INCR the
// per-client key, set it to expire after the window on its first hit, and reject once the count
// exceeds the limit. Same Redis instance, same key prefixes, same limits as before.

async function checkRateLimit(
  request: Request,
  opts: { prefix: string; limit: number; windowSeconds: number; message: string },
): Promise<void> {
  const clientId = getClientId(request);
  const key = `${opts.prefix}${clientId}`;

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, opts.windowSeconds);
  }

  if (count > opts.limit) {
    throw new RateLimitedError(opts.message);
  }
}

// Most reverse proxies (Cloud Run included) set X-Forwarded-For to "client, proxy1, proxy2..." —
// the first entry is the original client. Falls back to a constant bucket if it's ever missing
// (e.g. local dev with no proxy in front), which just means local requests share one rate-limit
// bucket instead of being un-limited.
function getClientId(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}

export function mutationRateLimit(request: Request): Promise<void> {
  return checkRateLimit(request, {
    prefix: "rl:mutation:",
    limit: 60,
    windowSeconds: 60,
    message: "Too many requests. Please try again shortly.",
  });
}

export function uploadRateLimit(request: Request): Promise<void> {
  return checkRateLimit(request, {
    prefix: "rl:upload:",
    limit: 20,
    windowSeconds: 60,
    message: "Too many uploads. Please try again shortly.",
  });
}
