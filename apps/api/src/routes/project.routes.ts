import { Router } from "express";
import {
  createProjectSchema,
  idParamSchema,
  listProjectsQuerySchema,
  updateProjectSchema,
  workspaceIdParamSchema,
} from "@repo/validation";
import { requireAuth } from "../middleware/auth.middleware";
import {
  ALL_ROLES,
  requireWorkspaceRole,
  resolveWorkspaceIdFromParam,
  resolveWorkspaceIdFromProjectParam,
  WRITE_ROLES,
} from "../middleware/rbac.middleware";
import { validate } from "../middleware/validate.middleware";
import { mutationRateLimiter } from "../middleware/rate-limit.middleware";
import { projectController } from "../controllers/project.controller";

/*

Mounted in two places:

  - /workspaces/:workspaceId/projects for creating and listing projects.
  - /projects for updating and deleting a project by ID.

*/

const nestedRouter = Router({ mergeParams: true }); // used for nested routes like /workspaces/:workspaceId/projects/...

// POST /workspaces/:workspaceId/projects — create a project inside a workspace which requires ADMIN or EDITOR role in that workspace.

nestedRouter.post(
  "/",
  mutationRateLimiter,
  requireAuth,
  requireWorkspaceRole(WRITE_ROLES, resolveWorkspaceIdFromParam("workspaceId")),
  validate({ params: workspaceIdParamSchema, body: createProjectSchema }),
  projectController.create,
);

// GET /workspaces/:workspaceId/projects — list projects in a workspace. Any workspace member (ADMIN, EDITOR, or VIEWER) can view.

nestedRouter.get(
  "/",
  requireAuth,
  requireWorkspaceRole(ALL_ROLES, resolveWorkspaceIdFromParam("workspaceId")),
  validate({ params: workspaceIdParamSchema, query: listProjectsQuerySchema }),
  projectController.list,
);

const directRouter = Router(); // used for direct routes like /projects/...

// PATCH /projects/:id — update a project directly by its id. Resolves the parent workspace from the project, then requires write access.

directRouter.patch(
  "/:id",
  mutationRateLimiter,
  requireAuth,
  requireWorkspaceRole(WRITE_ROLES, resolveWorkspaceIdFromProjectParam("id")),
  validate({ params: idParamSchema, body: updateProjectSchema }),
  projectController.update,
);

// DELETE /projects/:id — delete a project directly by its id. Resolves the parent workspace from the project, then requires write access.

directRouter.delete(
  "/:id",
  mutationRateLimiter,
  requireAuth,
  requireWorkspaceRole(WRITE_ROLES, resolveWorkspaceIdFromProjectParam("id")),
  validate({ params: idParamSchema }),
  projectController.remove,
);

export { nestedRouter as nestedProjectRouter, directRouter as directProjectRouter };
