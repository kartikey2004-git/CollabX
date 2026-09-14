import { withApiHandler } from "@/lib/api-handler";
import { sendSuccess } from "@/lib/response";
import { requireAuth, requireRole, CONTRIBUTOR_OR_ADMIN } from "@/lib/auth-session";
import { mutationRateLimit } from "@/lib/rate-limit";
import { parseBody, parseQuery } from "@/lib/validate";
import { createArticleSchema, listArticlesQuerySchema } from "@/lib/validation";
import { articleService } from "@/lib/services/article.service";

// GET /api/v1/articles — public (PUBLISHED-only) listing, filterable by category, cursor-paginated.
export const GET = withApiHandler(async (request) => {
  const query = parseQuery(listArticlesQuerySchema, new URL(request.url).searchParams);
  const { items, nextCursor, hasMore } = await articleService.list(query);
  return sendSuccess(items, { meta: { nextCursor, hasMore } });
});

// POST /api/v1/articles — create a new Article + its initial (v1) Submission. CONTRIBUTOR or ADMIN only.
export const POST = withApiHandler(async (request) => {
  await mutationRateLimit(request);
  const { user } = await requireAuth(request);
  requireRole(user, CONTRIBUTOR_OR_ADMIN);
  const input = parseBody(createArticleSchema, await request.json());
  const result = await articleService.create(user.id, input);
  return sendSuccess(result, { status: 201 });
});
