"use client";

import { authClient } from "@repo/auth";
import type { Role } from "@repo/database";

/*

better-auth's React client (`packages/auth/src/client.ts`) is created without the
`inferAdditionalFields` client plugin, so its generated `useSession()` type doesn't know about the
`role` field the backend registered via `user.additionalFields.role` (see
apps/api/src/lib/auth.ts and docs/changes/004-backend-changes.md's "Role exposure fix"). The field
IS genuinely present on the session JSON at runtime (confirmed live in the backend's own smoke
test), so rather than forking/duplicating the shared `@repo/auth` client just to fix its TypeScript
types, this hook widens the type by hand at the one place the frontend reads it.

*/

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

// The one place every component reads "who is logged in, and what's their platform role" — wraps
// better-auth's own `useSession` so nothing else needs to re-cast `session.user`.

export function useCurrentUser() {
  const { data, isPending, error } = authClient.useSession();
  const user = data?.user as unknown as SessionUser | undefined;

  return {
    user,
    role: user?.role,
    isAuthenticated: Boolean(user),
    isPending,
    error,
  };
}
