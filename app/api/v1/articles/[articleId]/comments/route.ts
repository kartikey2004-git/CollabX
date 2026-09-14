import { withApiHandler } from "@/lib/api-handler";
import { sendSuccess } from "@/lib/response";
import { optionalAuth, requireAuth, requireRole, ALL_ROLES } from "@/lib/auth-session";
import { mutationRateLimit } from "@/lib/rate-limit";
import { parseParams, parseBody, parseQuery } from "@/lib/validate";
import { articleIdParamSchema, createCommentSchema, listCommentsQuerySchema } from "@/lib/validation";
import { commentService } from "@/lib/services/comment.service";

// POST /api/v1/articles/:articleId/comments — any authenticated Role (READER included).
// Restricted to PUBLISHED content only — enforced in comment.service.ts.
export const POST = withApiHandler(async (request, { params }: { params: { articleId: string } }) => {
  await mutationRateLimit(request);
  const { user } = await requireAuth(request);
  requireRole(user, ALL_ROLES);
  const { articleId } = parseParams(articleIdParamSchema, params);
  const input = parseBody(createCommentSchema, await request.json());
  const comment = await commentService.create("article", articleId, user.id, input);
  return sendSuccess(comment, { status: 201 });
});

// GET /api/v1/articles/:articleId/comments — public (anyone, including anonymous callers).
export const GET = withApiHandler(async (request, { params }: { params: { articleId: string } }) => {
  await optionalAuth(request);
  const { articleId } = parseParams(articleIdParamSchema, params);
  const query = parseQuery(listCommentsQuerySchema, new URL(request.url).searchParams);
  const { items, nextCursor, hasMore } = await commentService.list("article", articleId, query);
  return sendSuccess(items, { meta: { nextCursor, hasMore } });
});
