import { withApiHandler } from "@/lib/api-handler";
import { sendSuccess } from "@/lib/response";
import { requireAuth, requireRole, CONTRIBUTOR_OR_ADMIN } from "@/lib/auth-session";
import { mutationRateLimit } from "@/lib/rate-limit";
import { parseParams, parseBody, parseQuery } from "@/lib/validate";
import { techReadIdParamSchema, createSubmissionSchema, submissionHistoryQuerySchema } from "@/lib/validation";
import { submissionService } from "@/lib/services/submission.service";
import type { Role } from "@/lib/db";

// POST /api/v1/tech-reads/:techReadId/submissions — create the next version. Ownership (owner or
// ADMIN) is enforced in submission.service.ts, not here.
export const POST = withApiHandler(async (request, { params }: { params: { techReadId: string } }) => {
  await mutationRateLimit(request);
  const { user } = await requireAuth(request);
  requireRole(user, CONTRIBUTOR_OR_ADMIN);
  const { techReadId } = parseParams(techReadIdParamSchema, params);
  const input = parseBody(createSubmissionSchema, await request.json());
  const requester = { id: user.id, role: user.role as Role };
  const submission = await submissionService.createNewVersion("techRead", techReadId, requester, input);
  return sendSuccess(submission, { status: 201 });
});

// GET /api/v1/tech-reads/:techReadId/submissions — the full version history. Owner or ADMIN only.
export const GET = withApiHandler(async (request, { params }: { params: { techReadId: string } }) => {
  const { user } = await requireAuth(request);
  requireRole(user, CONTRIBUTOR_OR_ADMIN);
  const { techReadId } = parseParams(techReadIdParamSchema, params);
  const query = parseQuery(submissionHistoryQuerySchema, new URL(request.url).searchParams);
  const requester = { id: user.id, role: user.role as Role };
  const { items, nextCursor, hasMore } = await submissionService.listHistory(
    "techRead",
    techReadId,
    requester,
    query,
  );
  return sendSuccess(items, { meta: { nextCursor, hasMore } });
});
