import { withApiHandler } from "@/lib/api-handler";
import { sendSuccess } from "@/lib/response";
import { requireAuth, requireRole, ADMIN_ONLY } from "@/lib/auth-session";
import { mutationRateLimit } from "@/lib/rate-limit";
import { parseParams, parseBody } from "@/lib/validate";
import { userIdParamSchema, updateUserRoleSchema } from "@/lib/validation";
import { userService } from "@/lib/services/user.service";
import type { Role } from "@/lib/db";

// PATCH /api/v1/users/:id/role — ADMIN-only. Change a user's platform-wide Role (see
// user.service.ts::updateRole for the can't-change-your-own-role guard).
export const PATCH = withApiHandler(async (request, { params }: { params: { id: string } }) => {
  await mutationRateLimit(request);
  const { user } = await requireAuth(request);
  requireRole(user, ADMIN_ONLY);
  const { id } = parseParams(userIdParamSchema, params);
  const input = parseBody(updateUserRoleSchema, await request.json());
  const requester = { id: user.id, role: user.role as Role };
  const updated = await userService.updateRole(id, input, requester);
  return sendSuccess(updated);
});
