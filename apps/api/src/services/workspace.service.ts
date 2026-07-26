import db from "@repo/database";
import type { Workspace } from "@repo/database";
import type {
  CreateWorkspaceInput,
  ListWorkspacesQuery,
  UpdateWorkspaceInput,
} from "@repo/validation";
import { workspaceRepository } from "../repositories/workspace.repository";
import { workspaceMemberRepository } from "../repositories/workspace-member.repository";

export const workspaceService = {
  // Create a new workspace and make its creator an ADMIN member
  create(userId: string, input: CreateWorkspaceInput): Promise<Workspace> {
    // Wrap these database operations in a single transaction to ensure consistency: either both the workspace and the membership are created, or neither is.

    return db.$transaction(async (tx) => {
      // Create a workspace using the provided name and owner ID
      const workspace = await workspaceRepository.create({ name: input.name, ownerId: userId }, tx);

      // Creator is inserted as ADMIN so they immediately pass RBAC on their own workspace.
      await workspaceMemberRepository.create(workspace.id, userId, "ADMIN", tx);

      return workspace;
    });
  },

  // Rename an existing workspace.
  update(workspaceId: string, input: UpdateWorkspaceInput): Promise<Workspace> {
    return workspaceRepository.update(workspaceId, { name: input.name });
  },

  // Permanently delete a workspace and everything inside it.
  delete(workspaceId: string): Promise<Workspace> {
    // Hard delete — Workspace has no deletedAt column; every child FK (WorkspaceMember, Project, Artifact, ...) is onDelete: Cascade, so Postgres removes the whole subtree in this one statement.

    return workspaceRepository.hardDelete(workspaceId);
  },

  // Get a page of workspaces the given user is a member of.
  list(userId: string, query: ListWorkspacesQuery) {
    return workspaceRepository.findByMember({
      userId,
      cursor: query.cursor,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  },
};
