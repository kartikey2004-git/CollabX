import { withApiHandler } from "@/lib/api-handler";
import { sendSuccess } from "@/lib/response";
import { requireAuth, requireRole, CONTRIBUTOR_OR_ADMIN } from "@/lib/auth-session";
import { mutationRateLimit } from "@/lib/rate-limit";
import { parseBody, parseQuery } from "@/lib/validate";
import { createTechReadSchema, listTechReadsQuerySchema } from "@/lib/validation";
import { techReadService } from "@/lib/services/tech-read.service";

// GET /api/v1/tech-reads — public (PUBLISHED-only) listing.
export const GET = withApiHandler(async (request) => {
  const query = parseQuery(listTechReadsQuerySchema, new URL(request.url).searchParams);
  const { items, nextCursor, hasMore } = await techReadService.list(query);
  return sendSuccess(items, { meta: { nextCursor, hasMore } });
});

// POST /api/v1/tech-reads — create a new TechRead + its initial (v1) Submission. CONTRIBUTOR or ADMIN only.
export const POST = withApiHandler(async (request) => {
  await mutationRateLimit(request);
  const { user } = await requireAuth(request);
  requireRole(user, CONTRIBUTOR_OR_ADMIN);
  const input = parseBody(createTechReadSchema, await request.json());
  const result = await techReadService.create(user.id, input);
  return sendSuccess(result, { status: 201 });
});
