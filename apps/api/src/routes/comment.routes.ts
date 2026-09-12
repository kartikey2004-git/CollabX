import { Router } from "express";
import {
  articleIdParamSchema,
  createCommentSchema,
  idParamSchema,
  listCommentsQuerySchema,
  techReadIdParamSchema,
} from "@repo/validation";
import { optionalAuth, requireAuth } from "../middleware/auth.middleware";
import { ALL_ROLES, requireRole } from "../middleware/rbac.middleware";
import { validate } from "../middleware/validate.middleware";
import { mutationRateLimiter } from "../middleware/rate-limit.middleware";
import { createCommentController, commentController } from "../controllers/comment.controller";
import type { CommentParentType } from "../repositories/comment.repository";

/*

Mounted in two places, per resource:

- /articles/:articleId/comments and /tech-reads/:techReadId/comments for create/list.
- /comments/:id for delete, which isn't parent-type-specific.

*/
export function createNestedCommentRouter(parentType: CommentParentType): Router {
  const router = Router({ mergeParams: true });
  const controller = createCommentController(parentType);
  const paramSchema = parentType === "article" ? articleIdParamSchema : techReadIdParamSchema;

  // POST .../comments — any authenticated Role (READER included — schema.prisma's own comment on
  // Role: "READER is the default for everyone else, can still comment"). Restricted to PUBLISHED
  // content only — enforced in comment.service.ts.
  router.post(
    "/",
    mutationRateLimiter,
    requireAuth,
    requireRole(ALL_ROLES),
    validate({ params: paramSchema, body: createCommentSchema }),
    controller.create,
  );

  // GET .../comments — public (anyone, including anonymous callers, can read comments on
  // published content), newest first, cursor-paginated. See comment.service.ts::list's
  // assertParentIsPublished check for why an anonymous/non-owner caller can't read comments on
  // unpublished content just by knowing its id.
  router.get(
    "/",
    optionalAuth,
    validate({ params: paramSchema, query: listCommentsQuerySchema }),
    controller.list,
  );

  return router;
}

// Mounted at /comments in v1.routes.ts.
const directRouter = Router();

// DELETE /comments/:id — soft-delete only (the DB physically refuses a hard delete on a comment
// with live replies — see schema.prisma's comment on Comment.parentComment). Author or ADMIN only,
// enforced in comment.service.ts.
directRouter.delete(
  "/:id",
  mutationRateLimiter,
  requireAuth,
  requireRole(ALL_ROLES), // ownership is checked in the service; ADMIN_ONLY would wrongly block authors
  validate({ params: idParamSchema }),
  commentController.remove,
);

export { directRouter as directCommentRouter };
