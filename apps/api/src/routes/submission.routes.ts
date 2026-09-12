import { Router } from "express";
import {
  articleIdParamSchema,
  createSubmissionSchema,
  idParamSchema,
  listIndexableQuerySchema,
  reviewSubmissionSchema,
  submissionHistoryQuerySchema,
  submissionQueueQuerySchema,
  techReadIdParamSchema,
} from "@repo/validation";
import { requireAuth } from "../middleware/auth.middleware";
import { ADMIN_ONLY, ALL_ROLES, CONTRIBUTOR_OR_ADMIN, requireRole } from "../middleware/rbac.middleware";
import { validate } from "../middleware/validate.middleware";
import { mutationRateLimiter } from "../middleware/rate-limit.middleware";
import { createSubmissionController, submissionController } from "../controllers/submission.controller";
import type { ParentType } from "../repositories/submission.repository";

/*

Mounted in two places, per resource:

- /articles/:articleId/submissions and /tech-reads/:techReadId/submissions for creating a new
  version / listing a content item's full version history (this factory, parameterized by which
  parent type the router is mounted under — mirrors the OLD rbac.middleware.ts's
  `resolveWorkspaceIdFromParam`-style factory-function convention).
- /submissions/:id for get/submit/review, which aren't parent-type-specific.

*/
export function createNestedSubmissionRouter(parentType: ParentType): Router {
  const router = Router({ mergeParams: true });
  const controller = createSubmissionController(parentType);
  const paramSchema = parentType === "article" ? articleIdParamSchema : techReadIdParamSchema;

  // POST .../submissions — create the next version. Ownership (owner or ADMIN) is enforced in
  // submission.service.ts, not here, since it depends on the specific article/tech-read row.
  router.post(
    "/",
    mutationRateLimiter,
    requireAuth,
    requireRole(CONTRIBUTOR_OR_ADMIN),
    validate({ params: paramSchema, body: createSubmissionSchema }),
    controller.createNewVersion,
  );

  // GET .../submissions — the full version history (all statuses). Owner or ADMIN only (enforced
  // in the service).
  router.get(
    "/",
    requireAuth,
    requireRole(CONTRIBUTOR_OR_ADMIN),
    validate({ params: paramSchema, query: submissionHistoryQuerySchema }),
    controller.listHistory,
  );

  return router;
}

// Mounted at /submissions in v1.routes.ts.
const directRouter = Router();

// GET /submissions — the ADMIN moderation queue (status=PENDING_REVIEW by default, oldest first).
// MUST be registered before "/:id" so Express doesn't treat this as an id lookup.
directRouter.get(
  "/",
  requireAuth,
  requireRole(ADMIN_ONLY),
  validate({ query: submissionQueueQuerySchema }),
  submissionController.listQueue,
);

// GET /submissions/indexing — ADMIN-only "Indexing" dashboard (see submission.service.ts::
// listIndexable). MUST be registered before "/:id", same reason as "/" above — otherwise Express
// would treat "indexing" as an :id lookup.
directRouter.get(
  "/indexing",
  requireAuth,
  requireRole(ADMIN_ONLY),
  validate({ query: listIndexableQuerySchema }),
  submissionController.listIndexable,
);

// GET /submissions/:id — owner, ADMIN, or (if PUBLISHED) anyone.
directRouter.get(
  "/:id",
  requireAuth,
  requireRole(ALL_ROLES),
  validate({ params: idParamSchema }),
  submissionController.getById,
);

// POST /submissions/:id/submit — DRAFT -> PENDING_REVIEW. Owner or ADMIN (enforced in the service).
directRouter.post(
  "/:id/submit",
  mutationRateLimiter,
  requireAuth,
  requireRole(CONTRIBUTOR_OR_ADMIN),
  validate({ params: idParamSchema }),
  submissionController.submitForReview,
);

// PATCH /submissions/:id/review — ADMIN-only publish/reject. See submission.service.ts::review for
// the transactional publish/reject logic this triggers.
directRouter.patch(
  "/:id/review",
  mutationRateLimiter,
  requireAuth,
  requireRole(ADMIN_ONLY),
  validate({ params: idParamSchema, body: reviewSubmissionSchema }),
  submissionController.review,
);

// POST /submissions/:id/reindex — ADMIN-only manual re-enqueue. See
// submission.service.ts::reindex for why only a PUBLISHED submission is eligible.
directRouter.post(
  "/:id/reindex",
  mutationRateLimiter,
  requireAuth,
  requireRole(ADMIN_ONLY),
  validate({ params: idParamSchema }),
  submissionController.reindex,
);

export { directRouter as directSubmissionRouter };
