import { withApiHandler } from "@/lib/api-handler";
import { sendSuccess } from "@/lib/response";
import { requireAuth, requireRole, ADMIN_ONLY } from "@/lib/auth-session";
import { mutationRateLimit } from "@/lib/rate-limit";
import { parseParams } from "@/lib/validate";
import { idParamSchema } from "@/lib/validation";
import { submissionService } from "@/lib/services/submission.service";

// POST /api/v1/submissions/:id/reindex — ADMIN-only manual re-enqueue.
export const POST = withApiHandler(async (request, { params }: { params: { id: string } }) => {
  await mutationRateLimit(request);
  const { user } = await requireAuth(request);
  requireRole(user, ADMIN_ONLY);
  const { id } = parseParams(idParamSchema, params);
  const submission = await submissionService.reindex(id);
  return sendSuccess(submission);
});
