"use client";

import { createAuthClient } from "better-auth/react";

// Same-origin now — better-auth's client defaults to the current page's origin when no baseURL is
// given, which is exactly right since the auth Route Handler (app/api/auth/[...all]/route.ts)
// lives in this same Next.js app.
export const authClient = createAuthClient({
  basePath: "/api/auth",
});

export type AuthClientType = typeof authClient;
