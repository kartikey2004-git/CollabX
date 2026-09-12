import { Router } from "express";
import {
  articleSlugParamSchema,
  createArticleSchema,
  idParamSchema,
  listArticlesAdminQuerySchema,
  listArticlesQuerySchema,
} from "@repo/validation";
import { optionalAuth, requireAuth } from "../middleware/auth.middleware";
import { ADMIN_ONLY, CONTRIBUTOR_OR_ADMIN, requireRole } from "../middleware/rbac.middleware";
import { validate } from "../middleware/validate.middleware";
import { mutationRateLimiter } from "../middleware/rate-limit.middleware";
import { articleController } from "../controllers/article.controller";

// Mounted at /articles in v1.routes.ts.
const router = Router();

// POST /articles — create a new Article + its initial (v1) Submission. CONTRIBUTOR or ADMIN only.
router.post(
  "/",
  mutationRateLimiter,
  requireAuth,
  requireRole(CONTRIBUTOR_OR_ADMIN),
  validate({ body: createArticleSchema }),
  articleController.create,
);

// GET /articles/mine — MUST be registered before "/:id" so Express doesn't treat "mine" as an id.
// CONTRIBUTOR sees their own articles (any status); ADMIN sees every non-deleted article.
router.get(
  "/mine",
  requireAuth,
  requireRole(CONTRIBUTOR_OR_ADMIN),
  validate({ query: listArticlesAdminQuerySchema }),
  articleController.listMine,
);

// GET /articles/slug/:slug — public (PUBLISHED-only, except for the article's own owner/ADMIN)
// lookup by slug, for SEO-friendly URLs. Also registered before "/:id". Anonymous callers are
// welcome here — `optionalAuth` (not requireAuth) populates req.user if a session exists but never
// blocks the request if it doesn't; there's deliberately no requireRole gate at all (requireRole
// assumes req.user exists and would crash on an anonymous request).
router.get(
  "/slug/:slug",
  optionalAuth,
  validate({ params: articleSlugParamSchema }),
  articleController.getBySlug,
);

// GET /articles — public (PUBLISHED-only) listing, filterable by category, cursor-paginated.
router.get(
  "/",
  optionalAuth,
  validate({ query: listArticlesQuerySchema }),
  articleController.list,
);

// GET /articles/:id — fetch one article by id (same PUBLISHED-only visibility rule as above).
router.get(
  "/:id",
  optionalAuth,
  validate({ params: idParamSchema }),
  articleController.getById,
);

/*

DELETE /articles/:id — soft-delete. ADMIN-only (a judgment call — see article.service.ts's comment
on `delete` and 004-backend-changes.md for the full reasoning: Article is the platform's single
shared moderation record, so its removal authority is kept aligned with publish/reject rather than
also being grantable to the original contributor).

*/
router.delete(
  "/:id",
  mutationRateLimiter,
  requireAuth,
  requireRole(ADMIN_ONLY),
  validate({ params: idParamSchema }),
  articleController.remove,
);

export default router;
