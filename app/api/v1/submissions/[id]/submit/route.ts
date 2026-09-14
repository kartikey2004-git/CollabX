import { withApiHandler } from "@/lib/api-handler";
import { sendSuccess } from "@/lib/response";
import { requireAuth, requireRole, CONTRIBUTOR_OR_ADMIN } from "@/lib/auth-session";
import { mutationRateLimit } from "@/lib/rate-limit";
import { parseParams } from "@/lib/validate";
import { idParamSchema } from "@/lib/validation";
import { submissionService } from "@/lib/services/submission.service";
import type { Role } from "@/lib/db";

// POST /api/v1/submissions/:id/submit — DRAFT -> PENDING_REVIEW. Owner or ADMIN (enforced in the service).
export const POST = withApiHandler(async (request, { params }: { params: { id: string } }) => {
  await mutationRateLimit(request);
  const { user } = await requireAuth(request);
  requireRole(user, CONTRIBUTOR_OR_ADMIN);
  const { id } = parseParams(idParamSchema, params);
  const requester = { id: user.id, role: user.role as Role };
  const submission = await submissionService.submitForReview(id, requester);
  return sendSuccess(submission);
});
