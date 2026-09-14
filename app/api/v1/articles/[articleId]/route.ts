import { withApiHandler } from "@/lib/api-handler";
import { sendSuccess } from "@/lib/response";
import { optionalAuth, requireAuth, requireRole, ADMIN_ONLY } from "@/lib/auth-session";
import { requesterFrom } from "@/lib/requester";
import { mutationRateLimit } from "@/lib/rate-limit";
import { parseParams } from "@/lib/validate";
import { articleIdParamSchema } from "@/lib/validation";
import { articleService } from "@/lib/services/article.service";

// The route segment is named [articleId], not [id] — it shares this path position with
// [articleId]/comments and [articleId]/submissions, and Next.js requires one consistent
// dynamic-segment name per path position across the whole route tree.

// GET /api/v1/articles/:articleId — fetch one article by id (same PUBLISHED-only visibility rule as the list).
export const GET = withApiHandler(async (request, { params }: { params: { articleId: string } }) => {
  const { articleId } = parseParams(articleIdParamSchema, params);
  const session = await optionalAuth(request);
  const article = await articleService.getById(articleId, requesterFrom(session?.user));
  return sendSuccess(article);
});

// DELETE /api/v1/articles/:articleId — soft-delete. ADMIN-only (Article is the platform's single
// shared moderation record, so its removal authority stays aligned with publish/reject).
export const DELETE = withApiHandler(async (request, { params }: { params: { articleId: string } }) => {
  await mutationRateLimit(request);
  const { user } = await requireAuth(request);
  requireRole(user, ADMIN_ONLY);
  const { articleId } = parseParams(articleIdParamSchema, params);
  const article = await articleService.delete(articleId);
  return sendSuccess(article);
});
