import { Router } from "express";
import {
  createArtifactSchema,
  idParamSchema,
  listArtifactsQuerySchema,
  projectIdParamSchema,
  updateArtifactSchema,
} from "@repo/validation";
import { requireAuth } from "../middleware/auth.middleware";
import {
  ALL_ROLES,
  requireWorkspaceRole,
  resolveWorkspaceIdFromArtifactParam,
  resolveWorkspaceIdFromProjectParam,
  WRITE_ROLES,
} from "../middleware/rbac.middleware";
import { validate } from "../middleware/validate.middleware";
import { mutationRateLimiter } from "../middleware/rate-limit.middleware";
import { artifactController } from "../controllers/artifact.controller";

// Mounted twice in v1.routes.ts: once under /projects/:projectId/artifacts (create/list) and once under /artifacts (get/update/delete by direct id).

const nestedRouter = Router({ mergeParams: true }); // used for nested routes

// POST /projects/:projectId/artifacts — create an artifact inside a project. which requires ADMIN or EDITOR role in the project's workspace.

nestedRouter.post(
  "/",
  mutationRateLimiter,
  requireAuth,
  requireWorkspaceRole(WRITE_ROLES, resolveWorkspaceIdFromProjectParam("projectId")),
  validate({ params: projectIdParamSchema, body: createArtifactSchema }),
  artifactController.create,
);

// GET /projects/:projectId/artifacts — list artifacts in a project. Any workspace member can view.

nestedRouter.get(
  "/",
  requireAuth,
  requireWorkspaceRole(ALL_ROLES, resolveWorkspaceIdFromProjectParam("projectId")),
  validate({ params: projectIdParamSchema, query: listArtifactsQuerySchema }),
  artifactController.list,
);

const directRouter = Router(); // used for direct routes

// GET /artifacts/:id — fetch one artifact directly by its id which resolves the parent workspace from the artifact, then requires membership (any role).

directRouter.get(
  "/:id",
  requireAuth,
  requireWorkspaceRole(ALL_ROLES, resolveWorkspaceIdFromArtifactParam("id")),
  validate({ params: idParamSchema }),
  artifactController.getById,
);

// PATCH /artifacts/:id — update an artifact directly by its id. Requires write access.
directRouter.patch(
  "/:id",
  mutationRateLimiter,
  requireAuth,
  requireWorkspaceRole(WRITE_ROLES, resolveWorkspaceIdFromArtifactParam("id")),
  validate({ params: idParamSchema, body: updateArtifactSchema }),
  artifactController.update,
);

// DELETE /artifacts/:id — delete an artifact directly by its id. Requires write access.
directRouter.delete(
  "/:id",
  mutationRateLimiter,
  requireAuth,
  requireWorkspaceRole(WRITE_ROLES, resolveWorkspaceIdFromArtifactParam("id")),
  validate({ params: idParamSchema }),
  artifactController.remove,
);

export { nestedRouter as nestedArtifactRouter, directRouter as directArtifactRouter };
