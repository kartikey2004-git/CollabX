import { Router } from "express";
import {
  createWorkspaceSchema,
  idParamSchema,
  listWorkspacesQuerySchema,
  updateWorkspaceSchema,
} from "@repo/validation";
import { requireAuth } from "../middleware/auth.middleware";
import {
  ADMIN_ONLY,
  requireWorkspaceRole,
  resolveWorkspaceIdFromParam,
} from "../middleware/rbac.middleware";
import { validate } from "../middleware/validate.middleware";
import { mutationRateLimiter } from "../middleware/rate-limit.middleware";
import { workspaceController } from "../controllers/workspace.controller";

const router = Router();

// POST /workspaces — create a new workspace. Must be logged in; rate-limited since it's a "write" action; body is validated against createWorkspaceSchema.

router.post(
  "/",
  mutationRateLimiter,
  requireAuth,
  validate({ body: createWorkspaceSchema }),
  workspaceController.create,
);

// GET /workspaces — list the workspaces the logged-in user belongs to.
router.get(
  "/",
  requireAuth,
  validate({ query: listWorkspacesQuerySchema }),
  workspaceController.list,
);

// PATCH /workspaces/:id — rename a workspace. Only workspace ADMINs can do this.
router.patch(
  "/:id",
  mutationRateLimiter,
  requireAuth,
  requireWorkspaceRole(ADMIN_ONLY, resolveWorkspaceIdFromParam("id")),
  validate({ params: idParamSchema, body: updateWorkspaceSchema }),
  workspaceController.update,
);

// DELETE /workspaces/:id — delete a workspace. Only workspace ADMINs can do this.
router.delete(
  "/:id",
  mutationRateLimiter,
  requireAuth,
  requireWorkspaceRole(ADMIN_ONLY, resolveWorkspaceIdFromParam("id")),
  validate({ params: idParamSchema }),
  workspaceController.remove,
);

export default router;
