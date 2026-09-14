import type { Role } from "./db";

// Builds the `{ id, role }` shape services use for ownership/visibility checks, from a session
// user that may or may not exist (see lib/auth-session.ts's `optionalAuth`, used on every "read
// published content" route now that those are public). An anonymous caller gets a "guest"
// requester — a role that can never be ADMIN and an id that can never match a real row's owner
// column (Prisma-generated ids are never an empty string) — so the existing
// `row.createdBy === user.id || user.role === "ADMIN"` ownership checks in article.service.ts /
// tech-read.service.ts naturally and correctly fall through to "guest sees PUBLISHED only" with no
// special-casing needed in the services themselves.
export function requesterFrom(user: { id: string; role: string } | null | undefined): {
  id: string;
  role: Role;
} {
  return user ? { id: user.id, role: user.role as Role } : { id: "", role: "READER" };
}
