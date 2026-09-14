import { withApiHandler } from "@/lib/api-handler";
import { sendSuccess } from "@/lib/response";
import { requireAuth, requireRole, ADMIN_ONLY } from "@/lib/auth-session";
import { parseQuery } from "@/lib/validate";
import { listUsersQuerySchema } from "@/lib/validation";
import { userService } from "@/lib/services/user.service";

// GET /api/v1/users — ADMIN-only "manage users" listing, optionally filtered by role.
export const GET = withApiHandler(async (request) => {
  const { user } = await requireAuth(request);
  requireRole(user, ADMIN_ONLY);
  const query = parseQuery(listUsersQuerySchema, new URL(request.url).searchParams);
  const { items, nextCursor, hasMore } = await userService.listUsers(query);
  return sendSuccess(items, { meta: { nextCursor, hasMore } });
});
