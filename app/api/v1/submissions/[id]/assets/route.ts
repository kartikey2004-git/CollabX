import { withApiHandler } from "@/lib/api-handler";
import { sendSuccess } from "@/lib/response";
import { requireAuth, requireRole, CONTRIBUTOR_OR_ADMIN } from "@/lib/auth-session";
import { uploadRateLimit } from "@/lib/rate-limit";
import { parseParams } from "@/lib/validate";
import { idParamSchema } from "@/lib/validation";
import { assetService } from "@/lib/services/asset.service";
import { ValidationError } from "@/lib/errors";
import type { Role } from "@/lib/db";

// POST /api/v1/submissions/:id/assets — uploads an image for inline use in a Submission's Markdown
// content. CONTRIBUTOR or ADMIN at the route-role level; the finer-grained "only THIS submission's
// owner (or an ADMIN), and only while it's still DRAFT" check happens in asset.service.ts.
//
// Multer's `req.file` (memory storage) is replaced by the Route Handler's native
// `request.formData()` — the file arrives as a Web API `File`, converted to a Buffer here for
// asset.service.ts, which does all the real MIME-allowlist + magic-byte validation itself (see
// asset.service.ts — the old upload.middleware.ts's multer-level MIME filter was purely a cheap
// early rejection on top of that, not carried over since it added nothing the service doesn't
// already enforce authoritatively).
export const POST = withApiHandler(async (request, { params }: { params: { id: string } }) => {
  await uploadRateLimit(request);
  const { user } = await requireAuth(request);
  requireRole(user, CONTRIBUTOR_OR_ADMIN);
  // The Next.js route segment is named [id] (consistent with its sibling routes
  // submissions/[id]/submit, /review, /reindex — Next.js requires one dynamic-segment name per
  // path position), so idParamSchema (not submissionIdParamSchema, which validates a field
  // literally called "submissionId") is what actually matches `params` here.
  const { id: submissionId } = parseParams(idParamSchema, params);

  const formData = await request.formData();
  const image = formData.get("image");
  if (!(image instanceof File)) {
    throw new ValidationError("Request validation failed", [
      { path: "body.image", message: "No file was uploaded" },
    ]);
  }

  const buffer = Buffer.from(await image.arrayBuffer());
  const requester = { id: user.id, role: user.role as Role };
  const asset = await assetService.upload(submissionId, requester, {
    buffer,
    mimetype: image.type,
    size: image.size,
  });
  return sendSuccess(asset, { status: 201 });
});
