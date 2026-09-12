import { NextFunction, Request, Response } from "express";
import type { Role } from "@repo/database";
import { ForbiddenError } from "../lib/errors";

/*

Platform-wide RBAC, replacing the OLD product's per-workspace `requireWorkspaceRole`.

The OLD middleware needed a "resolver" function because a role was meaningless without first
figuring out *which workspace* the request concerned (walking artifact -> project -> workspace
ancestry, then looking up a WorkspaceMember row for that specific workspace). That entire
indirection is gone: `Role` now lives directly on `User` (`req.user.role`), so checking it is a
plain array membership test with zero extra database round trips.

The OLD middleware's "404 not 403 when not a member" trick doesn't carry over either — there is no
more per-resource membership to hide the existence of. A `NotFoundError` is only needed here when
an id in the URL doesn't resolve to a real, non-deleted Article/TechRead/Submission/Comment at all,
and that check now lives in each resource's own service (it already has to fetch the row to do
anything useful with it), not in this middleware.

Ownership checks (e.g. "only the submission's own author, or an ADMIN, may edit this submission")
are resource-specific, not role-group-specific, so they are NOT implemented here either — they live
in each service as a plain `row.someOwnerField === userId || role === "ADMIN"` check, thrown as
ForbiddenError. This middleware only ever checks the coarse "is this role even allowed to hit this
route at all" gate.

*/

export const ALL_ROLES: Role[] = ["ADMIN", "CONTRIBUTOR", "READER"];
export const CONTRIBUTOR_OR_ADMIN: Role[] = ["ADMIN", "CONTRIBUTOR"];
export const ADMIN_ONLY: Role[] = ["ADMIN"];

/*

A middleware factory: checks that the logged-in user's platform-wide Role is one of the allowed
roles for this route. Every route that uses this runs `requireAuth` first (see auth.middleware.ts),
so `req.user` — and therefore `req.user.role` — is guaranteed to already be set by the time this
runs.

`req.user.role` is sourced from better-auth's session lookup, which re-fetches the User row (via
the Prisma adapter) on every `getSession` call rather than trusting a cached/signed payload — see
`lib/auth.ts`'s `additionalFields` config and `004-backend-changes.md` for why that's safe to trust
here and isn't a mass-assignment/privilege-escalation vector (`input: false` on the field means it
can never be set from a client-supplied signup/update request body).

*/

export function requireRole(allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const role = req.user!.role as Role;

    if (!allowedRoles.includes(role)) {
      next(new ForbiddenError());
      return;
    }

    next();
  };
}
