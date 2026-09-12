import type { Role, User } from "@repo/database";
import type { ListUsersQuery, UpdateUserRoleInput } from "@repo/validation";
import { userRepository } from "../repositories/user.repository";
import { ForbiddenError, NotFoundError } from "../lib/errors";

export const userService = {
  // ADMIN-only "manage users" listing — closes the gap documented in
  // docs/changes/008-final-summary.md: previously the only way to see/change a user's Role was a
  // direct database write.
  listUsers(query: ListUsersQuery) {
    return userRepository.list({ role: query.role, cursor: query.cursor, limit: query.limit });
  },

  /*

  Changes a user's platform-wide Role. ADMIN-only (enforced by the route).

  An admin may not change their own role through this endpoint (a judgment call, same style as
  the ownership checks elsewhere in this service layer): self-demotion could accidentally lock
  the platform's last admin out of ever undoing it, and self-promotion is meaningless (an admin
  is already an admin). Either way, a role change to your own account must come from a *different*
  admin. This is on top of, not instead of, better-auth's existing `input: false` on
  `additionalFields.role` (lib/auth.ts) — that blocks self-assignment at signup/profile-update;
  this blocks it here too, at the one legitimate place role changes are now allowed to happen.

  */
  async updateRole(
    targetId: string,
    input: UpdateUserRoleInput,
    requester: { id: string; role: Role },
  ): Promise<User> {
    if (targetId === requester.id) {
      throw new ForbiddenError("You cannot change your own role — ask another admin to do it");
    }

    const target = await userRepository.findById(targetId);
    if (!target) {
      throw new NotFoundError("User not found");
    }

    return userRepository.updateRole(targetId, input.role);
  },
};
