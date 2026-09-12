import type { Role } from "@repo/database";

/*

Platform-wide role predicates, mirroring the backend's `CONTRIBUTOR_OR_ADMIN` / `ADMIN_ONLY`
groups (apps/api/src/middleware/rbac.middleware.ts) — replaces the OLD per-workspace
`canManageWorkspace`/`canManageProjectsAndArtifacts` pair (use-workspace-role.ts, deleted) now that
roles are platform-wide instead of scoped to a workspace membership row.

IMPORTANT: these are UX-only. They decide whether to show/hide/disable a button, never whether an
action is actually allowed — the server re-checks every one of these with `requireRole(...)` on the
real request, and a stale cached role (e.g. an admin just downgraded this user) can still make the
server return 403 even after the button was shown. Every mutation hook in this app is expected to
surface that 403 through a toast (see lib/api-client.ts's `ApiError`), not crash.

*/

export function canCreateContent(role: Role | undefined): boolean {
  return role === "CONTRIBUTOR" || role === "ADMIN";
}

export function canModerate(role: Role | undefined): boolean {
  return role === "ADMIN";
}
