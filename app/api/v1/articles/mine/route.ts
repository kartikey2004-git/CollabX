import { withApiHandler } from "@/lib/api-handler";
import { sendSuccess } from "@/lib/response";
import { requireAuth, requireRole, CONTRIBUTOR_OR_ADMIN } from "@/lib/auth-session";
import { parseQuery } from "@/lib/validate";
import { listArticlesAdminQuerySchema } from "@/lib/validation";
import { articleService } from "@/lib/services/article.service";
import type { Role } from "@/lib/db";

// GET /api/v1/articles/mine — CONTRIBUTOR sees their own articles (any status); ADMIN sees every non-deleted article.
export const GET = withApiHandler(async (request) => {
  const { user } = await requireAuth(request);
  requireRole(user, CONTRIBUTOR_OR_ADMIN);
  const query = parseQuery(listArticlesAdminQuerySchema, new URL(request.url).searchParams);
  const requester = { id: user.id, role: user.role as Role };
  const { items, nextCursor, hasMore } = await articleService.listMine(requester, query);
  return sendSuccess(items, { meta: { nextCursor, hasMore } });
});
