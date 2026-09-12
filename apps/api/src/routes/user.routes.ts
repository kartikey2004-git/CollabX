import { Router } from "express";
import { listUsersQuerySchema, updateUserRoleSchema, userIdParamSchema } from "@repo/validation";
import { requireAuth } from "../middleware/auth.middleware";
import { ADMIN_ONLY, requireRole } from "../middleware/rbac.middleware";
import { validate } from "../middleware/validate.middleware";
import { mutationRateLimiter } from "../middleware/rate-limit.middleware";
import { userController } from "../controllers/user.controller";

// Mounted at /users in v1.routes.ts. Every route here is ADMIN-only — this is the platform's
// user-management surface, not a general-purpose "look up a user" endpoint.
const router = Router();

// GET /users — list users, optionally filtered by role.
router.get(
  "/",
  requireAuth,
  requireRole(ADMIN_ONLY),
  validate({ query: listUsersQuerySchema }),
  userController.list,
);

// PATCH /users/:id/role — change a user's platform-wide Role. Replaces the direct-database-write
// workaround this product used to require (see user.service.ts::updateRole for the
// can't-change-your-own-role guard).
router.patch(
  "/:id/role",
  mutationRateLimiter,
  requireAuth,
  requireRole(ADMIN_ONLY),
  validate({ params: userIdParamSchema, body: updateUserRoleSchema }),
  userController.updateRole,
);

export default router;
