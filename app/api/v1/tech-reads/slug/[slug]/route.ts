import { withApiHandler } from "@/lib/api-handler";
import { sendSuccess } from "@/lib/response";
import { optionalAuth } from "@/lib/auth-session";
import { requesterFrom } from "@/lib/requester";
import { parseParams } from "@/lib/validate";
import { articleSlugParamSchema } from "@/lib/validation";
import { techReadService } from "@/lib/services/tech-read.service";

// GET /api/v1/tech-reads/slug/:slug — public (PUBLISHED-only, except owner/ADMIN) lookup by slug.
export const GET = withApiHandler(async (request, { params }: { params: { slug: string } }) => {
  const { slug } = parseParams(articleSlugParamSchema, params);
  const session = await optionalAuth(request);
  const techRead = await techReadService.getBySlug(slug, requesterFrom(session?.user));
  return sendSuccess(techRead);
});
