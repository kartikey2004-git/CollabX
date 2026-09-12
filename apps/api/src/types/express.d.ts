import type { Session as AuthSession } from "../lib/auth";

// This adds our own custom fields onto Express's built-in Request type, so TypeScript knows about
// req.user/req.session everywhere without us having to cast or redeclare them in every file.
//
// There is no more `req.membership` field (that was the OLD product's per-workspace role lookup,
// set by the OLD rbac.middleware.ts's `requireWorkspaceRole`). Platform-wide `Role` now lives
// directly on `req.user.role` (populated via better-auth's `additionalFields` config in
// lib/auth.ts), so there's nothing left for a separate middleware-populated field to carry.

declare global {
  namespace Express {
    interface Request {
      // Set by `auth.middleware.ts` after a valid session is confirmed.
      user?: AuthSession["user"];
      session?: AuthSession["session"];
    }
  }
}

export {};
