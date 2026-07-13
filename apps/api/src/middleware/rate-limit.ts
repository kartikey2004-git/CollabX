import { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function rateLimitMiddleware(
  windowMs: number = 60000, // 1 minute
  maxRequests: number = 100
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || "unknown";
    const now = Date.now();

    let entry = rateLimitStore.get(key);

    // Clean up expired entries
    if (entry && now > entry.resetTime) {
      rateLimitStore.delete(key);
      entry = undefined;
    }

    if (!entry) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    entry.count++;

    if (entry.count > maxRequests) {
      res.status(429).json({
        error: "Too many requests",
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      });
      return;
    }

    next();
  };
}

export function authEndpointRateLimitMiddleware(
  windowMs: number = 60000,
  maxRequests: number = 10
) {
  return rateLimitMiddleware(windowMs, maxRequests);
}
