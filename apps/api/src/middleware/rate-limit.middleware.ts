import rateLimit from "express-rate-limit";

// Limits how many "write" requests (POST/PATCH/DELETE) a single client can make per minute, so one user can't spam the API. Counts are kept in memory, which works fine for one server instance but would need Redis if we ever ran multiple servers behind a load balancer.

export const mutationRateLimiter = rateLimit({
  windowMs: 60 * 1000, // The time window to count requests in which is 1 minute (window means the time period in which the requests are counted)

  limit: 60, // Max requests allowed per client within that window

  standardHeaders: true, // Enable standard headers (RateLimit, remaining, reset)

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

// A dedicated rate limit for image uploads. Uploads are more resource-intensive (multipart bodies, an object-storage round trip) than regular JSON requests, so they use a separate limit.

export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 1000, // The time window to count requests in which is 1 minute (window means the time period in which the requests are counted)

  limit: 20, // Max uploads per client per minute

  standardHeaders: true, // Enable standard headers (RateLimit, remaining, reset)

  legacyHeaders: false, // Disable legacy headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)

  // What to send back if a client goes over the limit.
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many uploads. Please try again shortly.",
    },
  },
});
