import { withApiHandler } from "@/lib/api-handler";
import { sendSuccess } from "@/lib/response";
import { optionalAuth, requireAuth, requireRole, ADMIN_ONLY } from "@/lib/auth-session";
import { requesterFrom } from "@/lib/requester";
import { mutationRateLimit } from "@/lib/rate-limit";
import { parseParams } from "@/lib/validate";
import { techReadIdParamSchema } from "@/lib/validation";
import { techReadService } from "@/lib/services/tech-read.service";

// The route segment is named [techReadId], not [id] — it shares this path position with
// [techReadId]/comments, [techReadId]/submissions, and [techReadId]/trending.

// GET /api/v1/tech-reads/:techReadId — fetch one tech read by id.
export const GET = withApiHandler(async (request, { params }: { params: { techReadId: string } }) => {
  const { techReadId } = parseParams(techReadIdParamSchema, params);
  const session = await optionalAuth(request);
  const techRead = await techReadService.getById(techReadId, requesterFrom(session?.user));
  return sendSuccess(techRead);
});

// DELETE /api/v1/tech-reads/:techReadId — soft-delete. ADMIN-only (same judgment call as articles).
export const DELETE = withApiHandler(async (request, { params }: { params: { techReadId: string } }) => {
  await mutationRateLimit(request);
  const { user } = await requireAuth(request);
  requireRole(user, ADMIN_ONLY);
  const { techReadId } = parseParams(techReadIdParamSchema, params);
  const techRead = await techReadService.delete(techReadId);
  return sendSuccess(techRead);
});
