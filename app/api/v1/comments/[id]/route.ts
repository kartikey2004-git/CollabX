import { withApiHandler } from "@/lib/api-handler";
import { sendSuccess } from "@/lib/response";
import { requireAuth, requireRole, ALL_ROLES } from "@/lib/auth-session";
import { mutationRateLimit } from "@/lib/rate-limit";
import { parseParams } from "@/lib/validate";
import { idParamSchema } from "@/lib/validation";
import { commentService } from "@/lib/services/comment.service";
import type { Role } from "@/lib/db";

// DELETE /api/v1/comments/:id — soft-delete only. Author or ADMIN only, enforced in comment.service.ts
// (ownership is checked there; ADMIN_ONLY here would wrongly block authors).
export const DELETE = withApiHandler(async (request, { params }: { params: { id: string } }) => {
  await mutationRateLimit(request);
  const { user } = await requireAuth(request);
  requireRole(user, ALL_ROLES);
  const { id } = parseParams(idParamSchema, params);
  const requester = { id: user.id, role: user.role as Role };
  const comment = await commentService.delete(id, requester);
  return sendSuccess(comment);
});
