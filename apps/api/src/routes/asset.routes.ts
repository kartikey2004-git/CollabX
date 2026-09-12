import { Router } from "express";
import { submissionIdParamSchema } from "@repo/validation";
import { requireAuth } from "../middleware/auth.middleware";
import { CONTRIBUTOR_OR_ADMIN, requireRole } from "../middleware/rbac.middleware";
import { validate } from "../middleware/validate.middleware";
import { uploadRateLimiter } from "../middleware/rate-limit.middleware";
import { imageUpload } from "../middleware/upload.middleware";
import { assetController } from "../controllers/asset.controller";

// Mounted at /submissions/:submissionId/assets in v1.routes.ts.
const router = Router({ mergeParams: true });

/*

POST /submissions/:submissionId/assets — uploads an image for inline use in a Submission's
Markdown content. CONTRIBUTOR or ADMIN at the route-role level; the finer-grained "only THIS
submission's owner (or an ADMIN), and only while it's still DRAFT" check happens in
asset.service.ts, since it depends on the specific submission row.

The `imageUpload` (multer) middleware parses the multipart/form-data request and makes the
uploaded file available as `req.file` before the controller runs — reused unchanged from the OLD
product's image-upload pipeline (same MIME allowlist, same 5MB limit).

*/
router.post(
  "/",
  uploadRateLimiter,
  requireAuth,
  requireRole(CONTRIBUTOR_OR_ADMIN),
  validate({ params: submissionIdParamSchema }),
  imageUpload,
  assetController.upload,
);

export default router;
