import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Replaces apps/api's `app.all("/api/auth/*splat", toNodeHandler(auth))`. better-auth's official
// Next.js Route Handler adapter — no manual mounting-before-body-parsers concern here, since Route
// Handlers don't have a global body parser to conflict with in the first place.
export const { GET, POST } = toNextJsHandler(auth);
