import { withApiHandler } from "@/lib/api-handler";
import { sendSuccess } from "@/lib/response";
import { requireAuth, requireRole, ALL_ROLES, CONTRIBUTOR_OR_ADMIN } from "@/lib/auth-session";
import { mutationRateLimit } from "@/lib/rate-limit";
import { parseParams, parseBody } from "@/lib/validate";
import { idParamSchema, updateSubmissionSchema } from "@/lib/validation";
import { submissionService } from "@/lib/services/submission.service";
import type { Role } from "@/lib/db";

// GET /api/v1/submissions/:id — owner, ADMIN, or (if PUBLISHED) anyone authenticated.
export const GET = withApiHandler(async (request, { params }: { params: { id: string } }) => {
  const { user } = await requireAuth(request);
  requireRole(user, ALL_ROLES);
  const { id } = parseParams(idParamSchema, params);
  const requester = { id: user.id, role: user.role as Role };
  const submission = await submissionService.getById(id, requester);
  return sendSuccess(submission);
});

// PATCH /api/v1/submissions/:id — in-place edit of a DRAFT/PENDING_REVIEW submission's own
// title/summary/content. Owner or ADMIN (enforced in the service, since it also depends on the
// submission's current status, not just who's asking).
export const PATCH = withApiHandler(async (request, { params }: { params: { id: string } }) => {
  await mutationRateLimit(request);
  const { user } = await requireAuth(request);
  requireRole(user, CONTRIBUTOR_OR_ADMIN);
  const { id } = parseParams(idParamSchema, params);
  const input = parseBody(updateSubmissionSchema, await request.json());
  const requester = { id: user.id, role: user.role as Role };
  const submission = await submissionService.update(id, requester, input);
  return sendSuccess(submission);
});
