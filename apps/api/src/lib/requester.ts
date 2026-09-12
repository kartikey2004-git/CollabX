import { Request } from "express";
import type { Role } from "@repo/database";

// Builds the `{ id, role }` shape services use for ownership/visibility checks, from a request
// that may or may not be authenticated (see middleware/auth.middleware.ts's `optionalAuth`, used
// on every "read published content" route now that those are public). An anonymous caller gets a
// "guest" requester — a role that can never be ADMIN and an id that can never match a real row's
// owner column (Prisma-generated ids are never an empty string) — so the existing
// `row.createdBy === user.id || user.role === "ADMIN"` ownership checks in article.service.ts /
// tech-read.service.ts naturally and correctly fall through to "guest sees PUBLISHED only" with no
// special-casing needed in the services themselves.
export function requesterFrom(req: Request): { id: string; role: Role } {
  return req.user ? { id: req.user.id, role: req.user.role as Role } : { id: "", role: "READER" };
}
