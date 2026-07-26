import type { Session as AuthSession } from "../lib/auth";
import type { WorkspaceRole } from "@repo/database";

// This adds our own custom fields onto Express's built-in Request type, so TypeScript knows about req.user, req.session, and req.membership everywhere without us having to cast or redeclare them in every file.

declare global {
  namespace Express {
    interface Request {
      // Set by `auth.middleware.ts` after a valid session is confirmed.
      user?: AuthSession["user"];
      session?: AuthSession["session"];

      // Set by `rbac.middleware.ts` once the caller's role in the resolved workspace is known.
      membership?: {
        workspaceId: string;
        role: WorkspaceRole;
      };
    }
  }
}

export { };