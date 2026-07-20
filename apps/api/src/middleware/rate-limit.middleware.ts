import rateLimit from "express-rate-limit";

// Limits how many "write" requests (POST/PATCH/DELETE) a single client can make per minute, so one user can't spam the API. Counts are kept in memory, which works fine for one server instance but would need Redis if we ever ran multiple servers behind a load balancer.

export const mutationRateLimiter = rateLimit({
  windowMs: 60 * 1000, // The time window to count requests in: 1 minute (window means the time period in which the requests are counted)

  limit: 60, // Max requests allowed per client within that window 

  standardHeaders: true, // Enable standard headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)

  legacyHeaders: false, // Disable legacy headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)

  // What to send back if a client goes over the limit.
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests. Please try again shortly.",
    },
  },
});
