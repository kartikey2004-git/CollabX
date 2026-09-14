import { withApiHandler } from "@/lib/api-handler";
import { sendSuccess } from "@/lib/response";
import { optionalAuth, requireAuth, requireRole, ALL_ROLES } from "@/lib/auth-session";
import { mutationRateLimit } from "@/lib/rate-limit";
import { parseParams, parseBody, parseQuery } from "@/lib/validate";
import { techReadIdParamSchema, createCommentSchema, listCommentsQuerySchema } from "@/lib/validation";
import { commentService } from "@/lib/services/comment.service";

// POST /api/v1/tech-reads/:techReadId/comments — any authenticated Role. PUBLISHED content only.
export const POST = withApiHandler(async (request, { params }: { params: { techReadId: string } }) => {
  await mutationRateLimit(request);
  const { user } = await requireAuth(request);
  requireRole(user, ALL_ROLES);
  const { techReadId } = parseParams(techReadIdParamSchema, params);
  const input = parseBody(createCommentSchema, await request.json());
  const comment = await commentService.create("techRead", techReadId, user.id, input);
  return sendSuccess(comment, { status: 201 });
});

// GET /api/v1/tech-reads/:techReadId/comments — public.
export const GET = withApiHandler(async (request, { params }: { params: { techReadId: string } }) => {
  await optionalAuth(request);
  const { techReadId } = parseParams(techReadIdParamSchema, params);
  const query = parseQuery(listCommentsQuerySchema, new URL(request.url).searchParams);
  const { items, nextCursor, hasMore } = await commentService.list("techRead", techReadId, query);
  return sendSuccess(items, { meta: { nextCursor, hasMore } });
});
