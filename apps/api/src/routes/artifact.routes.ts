import { Router } from "express";
import {
  artifactVersionParamSchema,
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
import { mutationRateLimiter, uploadRateLimiter } from "../middleware/rate-limit.middleware";
import { imageUpload } from "../middleware/upload.middleware";
import { artifactController } from "../controllers/artifact.controller";
import { versionController } from "../controllers/version.controller";
import { imageController } from "../controllers/image.controller";

/* 

Mounted in two places:

- /projects/:projectId/artifacts for create/list operations.
- /artifacts for get, update, and delete operations by artifact ID.

*/

const nestedRouter = Router({ mergeParams: true }); // used for nested routes like /projects/:projectId/artifacts/...

// POST /projects/:projectId/artifacts — create an artifact inside a project which requires ADMIN or EDITOR role in the project's workspace.

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

const directRouter = Router(); // used for direct routes like /artifacts/...

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

// GET /artifacts/:id/parent — the artifact's parent (or null, if it's a root artifact). Any workspace member can view.

directRouter.get(
  "/:id/parent",
  requireAuth,
  requireWorkspaceRole(ALL_ROLES, resolveWorkspaceIdFromArtifactParam("id")),
  validate({ params: idParamSchema }),
  artifactController.getParent,
);

// GET /artifacts/:id/children — the artifact's direct children. Any workspace member can view.

directRouter.get(
  "/:id/children",
  requireAuth,
  requireWorkspaceRole(ALL_ROLES, resolveWorkspaceIdFromArtifactParam("id")),
  validate({ params: idParamSchema }),
  artifactController.getChildren,
);

// GET /artifacts/:id/versions — the artifact's version history, newest first. Any workspace member can view.

directRouter.get(
  "/:id/versions",
  requireAuth,
  requireWorkspaceRole(ALL_ROLES, resolveWorkspaceIdFromArtifactParam("id")),
  validate({ params: idParamSchema }),
  versionController.list,
);

// POST /artifacts/:id/versions/:versionId/restore — Restores an older version by replacing the artifact's current content. Requires write access since this modifies the artifact.

directRouter.post(
  "/:id/versions/:versionId/restore",
  mutationRateLimiter,
  requireAuth,
  requireWorkspaceRole(WRITE_ROLES, resolveWorkspaceIdFromArtifactParam("id")),
  validate({ params: artifactVersionParamSchema }),
  versionController.restore,
);

/*

 -  POST /artifacts/:id/upload-image — uploads an image for inline use in a Markdown artifact. Requires write access since it modifies the artifact's content.

 - The `imageUpload` (multer) middleware parses the multipart/form-data request and makes the uploaded file available as `req.file` before the controller runs. This middleware is applied only to this route because every other endpoint in the API accepts JSON requests, not multipart form data.

*/

directRouter.post(
  "/:id/upload-image",
  uploadRateLimiter,
  requireAuth,
  requireWorkspaceRole(WRITE_ROLES, resolveWorkspaceIdFromArtifactParam("id")),
  validate({ params: idParamSchema }),
  imageUpload,
  imageController.upload,
);

export { nestedRouter as nestedArtifactRouter, directRouter as directArtifactRouter };
