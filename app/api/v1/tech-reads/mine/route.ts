import { withApiHandler } from "@/lib/api-handler";
import { sendSuccess } from "@/lib/response";
import { requireAuth, requireRole, CONTRIBUTOR_OR_ADMIN } from "@/lib/auth-session";
import { parseQuery } from "@/lib/validate";
import { listTechReadsAdminQuerySchema } from "@/lib/validation";
import { techReadService } from "@/lib/services/tech-read.service";
import type { Role } from "@/lib/db";

// GET /api/v1/tech-reads/mine — CONTRIBUTOR sees their own tech reads; ADMIN sees every non-deleted one.
export const GET = withApiHandler(async (request) => {
  const { user } = await requireAuth(request);
  requireRole(user, CONTRIBUTOR_OR_ADMIN);
  const query = parseQuery(listTechReadsAdminQuerySchema, new URL(request.url).searchParams);
  const requester = { id: user.id, role: user.role as Role };
  const { items, nextCursor, hasMore } = await techReadService.listMine(requester, query);
  return sendSuccess(items, { meta: { nextCursor, hasMore } });
});
