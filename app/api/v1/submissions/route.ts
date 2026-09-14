import { withApiHandler } from "@/lib/api-handler";
import { sendSuccess } from "@/lib/response";
import { requireAuth, requireRole, ADMIN_ONLY } from "@/lib/auth-session";
import { parseQuery } from "@/lib/validate";
import { submissionQueueQuerySchema } from "@/lib/validation";
import { submissionService } from "@/lib/services/submission.service";

// GET /api/v1/submissions — the ADMIN moderation queue (status=PENDING_REVIEW by default, oldest first).
export const GET = withApiHandler(async (request) => {
  const { user } = await requireAuth(request);
  requireRole(user, ADMIN_ONLY);
  const query = parseQuery(submissionQueueQuerySchema, new URL(request.url).searchParams);
  const { items, nextCursor, hasMore } = await submissionService.listQueue(query);
  return sendSuccess(items, { meta: { nextCursor, hasMore } });
});
