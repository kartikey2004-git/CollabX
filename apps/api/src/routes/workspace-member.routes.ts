import { Router } from "express";
import {
  inviteWorkspaceMemberSchema,
  updateWorkspaceMemberRoleSchema,
  workspaceIdParamSchema,
  workspaceMemberParamSchema,
} from "@repo/validation";
import { requireAuth } from "../middleware/auth.middleware";
import {
  ADMIN_ONLY,
  ALL_ROLES,
  requireWorkspaceRole,
  resolveWorkspaceIdFromParam,
} from "../middleware/rbac.middleware";
import { validate } from "../middleware/validate.middleware";
import { mutationRateLimiter } from "../middleware/rate-limit.middleware";
import { workspaceMemberController } from "../controllers/workspace-member.controller";

/*

- Mounted under /workspaces/:workspaceId/members in v1.routes.ts.

- Every endpoint operates within a specific workspace, so a single router is enough unlike projects and artifacts, there's no separate router for direct ID-based operations.

*/

const router = Router({ mergeParams: true });

// POST /workspaces/:workspaceId/members — invite an existing platform user into the workspace. ADMIN-only.

router.post(
  "/",
  mutationRateLimiter,
  requireAuth,
  requireWorkspaceRole(ADMIN_ONLY, resolveWorkspaceIdFromParam("workspaceId")),
  validate({
    params: workspaceIdParamSchema,
    body: inviteWorkspaceMemberSchema,
  }),
  workspaceMemberController.invite,
);

// GET /workspaces/:workspaceId/members — list the workspace's members. Any member (ADMIN, EDITOR, or VIEWER) can view.

router.get(
  "/",
  requireAuth,
  requireWorkspaceRole(ALL_ROLES, resolveWorkspaceIdFromParam("workspaceId")),
  validate({ params: workspaceIdParamSchema }),
  workspaceMemberController.list,
);

// PATCH /workspaces/:workspaceId/members/:userId — change a member's role. ADMIN-only.

router.patch(
  "/:userId",
  mutationRateLimiter,
  requireAuth,
  requireWorkspaceRole(ADMIN_ONLY, resolveWorkspaceIdFromParam("workspaceId")),
  validate({
    params: workspaceMemberParamSchema,
    body: updateWorkspaceMemberRoleSchema,
  }),
  workspaceMemberController.updateRole,
);

// DELETE /workspaces/:workspaceId/members/:userId — remove a member from the workspace. ADMIN-only.

router.delete(
  "/:userId",
  mutationRateLimiter,
  requireAuth,
  requireWorkspaceRole(ADMIN_ONLY, resolveWorkspaceIdFromParam("workspaceId")),
  validate({ params: workspaceMemberParamSchema }),
  workspaceMemberController.remove,
);

export default router;
