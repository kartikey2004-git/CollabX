import { withApiHandler } from "@/lib/api-handler";
import { sendSuccess } from "@/lib/response";
import { requireAuth, requireRole, ADMIN_ONLY } from "@/lib/auth-session";
import { mutationRateLimit } from "@/lib/rate-limit";
import { parseParams, parseBody } from "@/lib/validate";
import { idParamSchema, reviewSubmissionSchema } from "@/lib/validation";
import { submissionService } from "@/lib/services/submission.service";

// PATCH /api/v1/submissions/:id/review — ADMIN-only publish/reject.
export const PATCH = withApiHandler(async (request, { params }: { params: { id: string } }) => {
  await mutationRateLimit(request);
  const { user } = await requireAuth(request);
  requireRole(user, ADMIN_ONLY);
  const { id } = parseParams(idParamSchema, params);
  const input = parseBody(reviewSubmissionSchema, await request.json());
  const submission = await submissionService.review(id, user.id, input);
  return sendSuccess(submission);
});
