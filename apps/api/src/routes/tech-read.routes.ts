import { Router } from "express";
import {
  articleSlugParamSchema,
  createTechReadSchema,
  idParamSchema,
  listTechReadsAdminQuerySchema,
  listTechReadsQuerySchema,
  updateTechReadTrendingSchema,
} from "@repo/validation";
import { optionalAuth, requireAuth } from "../middleware/auth.middleware";
import { ADMIN_ONLY, CONTRIBUTOR_OR_ADMIN, requireRole } from "../middleware/rbac.middleware";
import { validate } from "../middleware/validate.middleware";
import { mutationRateLimiter } from "../middleware/rate-limit.middleware";
import { techReadController } from "../controllers/tech-read.controller";

// Mounted at /tech-reads in v1.routes.ts.
const router = Router();

// POST /tech-reads — create a new TechRead + its initial (v1) Submission. CONTRIBUTOR or ADMIN only.
router.post(
  "/",
  mutationRateLimiter,
  requireAuth,
  requireRole(CONTRIBUTOR_OR_ADMIN),
  validate({ body: createTechReadSchema }),
  techReadController.create,
);

// GET /tech-reads/mine — registered before "/:id" for the same reason as article.routes.ts.
router.get(
  "/mine",
  requireAuth,
  requireRole(CONTRIBUTOR_OR_ADMIN),
  validate({ query: listTechReadsAdminQuerySchema }),
  techReadController.listMine,
);

// GET /tech-reads/slug/:slug — public (PUBLISHED-only, except owner/ADMIN) lookup by slug.
// Anonymous callers welcome — see article.routes.ts's comment on optionalAuth for why there's no
// requireRole gate here.
router.get(
  "/slug/:slug",
  optionalAuth,
  validate({ params: articleSlugParamSchema }),
  techReadController.getBySlug,
);

// GET /tech-reads — public (PUBLISHED-only) listing. `?isTrending=true` is the "Trending Tech
// Reads" feed, sorted by trendingScore.
router.get(
  "/",
  optionalAuth,
  validate({ query: listTechReadsQuerySchema }),
  techReadController.list,
);

// GET /tech-reads/:id — fetch one tech read by id.
router.get(
  "/:id",
  optionalAuth,
  validate({ params: idParamSchema }),
  techReadController.getById,
);

/*

PATCH /tech-reads/:id/trending — ADMIN-only toggle for isTrending/trendingScore. Deliberately the
only direct-mutation endpoint on Article/TechRead's own row (see updateTechReadTrendingSchema's
comment) — every other field change goes through the Submission review flow.

*/
router.patch(
  "/:id/trending",
  mutationRateLimiter,
  requireAuth,
  requireRole(ADMIN_ONLY),
  validate({ params: idParamSchema, body: updateTechReadTrendingSchema }),
  techReadController.updateTrending,
);

// DELETE /tech-reads/:id — soft-delete. ADMIN-only (same judgment call as articles).
router.delete(
  "/:id",
  mutationRateLimiter,
  requireAuth,
  requireRole(ADMIN_ONLY),
  validate({ params: idParamSchema }),
  techReadController.remove,
);

export default router;
