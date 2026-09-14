import { auth, type Session } from "./auth";
import { UnauthenticatedError, ForbiddenError } from "./errors";
import type { Role } from "./db";

// Replaces apps/api's auth.middleware.ts. Route Handlers have no shared, mutable `req` object to
// attach a session onto the way Express middleware did (`req.user`/`req.session`) — each handler
// calls one of these directly instead, passing along the incoming `Request` so better-auth can
// read its cookies/headers (Next.js's `Request.headers` is already the Fetch API `Headers` type
// better-auth expects, so no `fromNodeHeaders`-style conversion is needed here).

// Runs before protected routes to make sure the request comes from a logged-in user. Throws
// UnauthenticatedError (caught by lib/api-handler.ts's withApiHandler) if not.
export async function requireAuth(request: Request): Promise<Session> {
  let result: Session | null;
  try {
    result = await auth.api.getSession({ headers: request.headers });
  } catch {
    throw new UnauthenticatedError();
  }
  if (!result) {
    throw new UnauthenticatedError();
  }
  return result;
}

/*

Like requireAuth, but never blocks the request — used on routes readable by anyone (published
Articles/TechReads and their comments), where a logged-in caller still gets a session back (so
ownership/role checks downstream can special-case their own drafts) but an anonymous caller is
just as valid a caller as anyone else, not an error case. Returns null instead of throwing.

Never pair this with requireRole(...) unless you've confirmed the session is non-null first — a
route using optionalAuth should either have no role gate at all, or check the result itself.

*/
export async function optionalAuth(request: Request): Promise<Session | null> {
  try {
    return await auth.api.getSession({ headers: request.headers });
  } catch {
    // A malformed/expired session shouldn't break a route anyone can hit anonymously — just treat
    // it the same as "no session" rather than failing the request.
    return null;
  }
}

// Checks that a logged-in user's platform-wide Role is one of the allowed roles for this route.
// Every caller runs requireAuth first, so `user.role` is guaranteed to already be populated.
export function requireRole(user: { role: string }, allowedRoles: Role[]): void {
  if (!allowedRoles.includes(user.role as Role)) {
    throw new ForbiddenError();
  }
}

export const ALL_ROLES: Role[] = ["ADMIN", "CONTRIBUTOR", "READER"];
export const CONTRIBUTOR_OR_ADMIN: Role[] = ["ADMIN", "CONTRIBUTOR"];
export const ADMIN_ONLY: Role[] = ["ADMIN"];
