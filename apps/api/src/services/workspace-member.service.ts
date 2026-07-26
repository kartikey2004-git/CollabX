import type { WorkspaceMember } from "@repo/database";
import type { InviteWorkspaceMemberInput, UpdateWorkspaceMemberRoleInput } from "@repo/validation";
import { ConflictError, NotFoundError, ValidationError } from "../lib/errors";
import { userRepository } from "../repositories/user.repository";
import {
  workspaceMemberRepository,
  WorkspaceMemberWithUser,
} from "../repositories/workspace-member.repository";

// Note: A workspace can never be left with zero ADMINs.

export const workspaceMemberService = {
  // Get every member of a workspace, with their user info attached.

  list(workspaceId: string): Promise<WorkspaceMemberWithUser[]> {
    return workspaceMemberRepository.list(workspaceId);
  },

  // Invite an existing platform user (by email) into a workspace with a given role. Note: The invitee must already be a registered user.

  async invite(workspaceId: string, input: InviteWorkspaceMemberInput): Promise<WorkspaceMember> {
    // Finds the user by email.
    const user = await userRepository.findByEmail(input.email);
    if (!user) {
      throw new NotFoundError("No platform user is registered with that email");
    }

    // Checks if the user is already a member of the workspace.
    const existing = await workspaceMemberRepository.findByWorkspaceAndUser(workspaceId, user.id);

    if (existing) {
      throw new ConflictError("This user is already a member of the workspace");
    }

    // Creates the workspace membership record.
    return workspaceMemberRepository.create(workspaceId, user.id, input.role);
  },

  // Changes a member's role, but prevents the update if it would remove the workspace's last remaining ADMIN.

  async updateRole(
    workspaceId: string,
    userId: string,
    input: UpdateWorkspaceMemberRoleInput,
  ): Promise<WorkspaceMember> {
    // Finds the member of the workspace
    const member = await workspaceMemberRepository.findByWorkspaceAndUser(workspaceId, userId);

    if (!member) {
      throw new NotFoundError("This user is not a member of the workspace");
    }

    // Before demoting an ADMIN, ensure they aren't the workspace's last remaining ADMIN , if that user is the last ADMIN it throws an error.
    if (member.role === "ADMIN" && input.role !== "ADMIN") {
      await assertNotLastAdmin(workspaceId);
    }

    // Updates the member's role
    return workspaceMemberRepository.updateRole(workspaceId, userId, input.role);
  },

  // Remove a member from a workspace, unless they're the workspace's only ADMIN.
  async remove(workspaceId: string, userId: string): Promise<WorkspaceMember> {
    // Finds the member of the workspace
    const member = await workspaceMemberRepository.findByWorkspaceAndUser(workspaceId, userId);

    if (!member) {
      throw new NotFoundError("This user is not a member of the workspace");
    }

    // Before removing an ADMIN, ensure they aren't the workspace's last remaining ADMIN , if that user is the last ADMIN it throws an error.
    if (member.role === "ADMIN") {
      await assertNotLastAdmin(workspaceId);
    }

    // Removes the member from the workspace
    return workspaceMemberRepository.remove(workspaceId, userId);
  },
};

// Reject the role change if it would remove the workspace's last remaining ADMIN. Every workspace must always have at least one ADMIN.

async function assertNotLastAdmin(workspaceId: string): Promise<void> {
  const adminCount = await workspaceMemberRepository.countAdmins(workspaceId);
  if (adminCount <= 1) {
    throw new ValidationError("A workspace must always have at least one ADMIN");
  }
}
