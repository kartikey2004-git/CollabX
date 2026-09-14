import { withApiHandler } from "@/lib/api-handler";
import { sendSuccess } from "@/lib/response";
import { optionalAuth } from "@/lib/auth-session";
import { requesterFrom } from "@/lib/requester";
import { parseParams } from "@/lib/validate";
import { articleSlugParamSchema } from "@/lib/validation";
import { articleService } from "@/lib/services/article.service";

// GET /api/v1/articles/slug/:slug — public (PUBLISHED-only, except for the article's own
// owner/ADMIN) lookup by slug, for SEO-friendly URLs.
export const GET = withApiHandler(async (request, { params }: { params: { slug: string } }) => {
  const { slug } = parseParams(articleSlugParamSchema, params);
  const session = await optionalAuth(request);
  const article = await articleService.getBySlug(slug, requesterFrom(session?.user));
  return sendSuccess(article);
});
