import db from "@repo/database";
import type { Prisma, WorkspaceMember, WorkspaceRole } from "@repo/database";

// Either the normal database client, or a transaction client (used when several database calls need to succeed or fail together).

type Db = typeof db | Prisma.TransactionClient;

// A membership row with the underlying user's display info attached what the members UI actually needs to render a list.

export type WorkspaceMemberWithUser = WorkspaceMember & {
  user: { id: string; name: string; email: string; image: string | null };
};

export const workspaceMemberRepository = {
  // Find this user's membership row (and role) for a specific workspace. Used everywhere we need to check if this user is allowed in this workspace.

  findByWorkspaceAndUser(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
    return db.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
  },

  // Add a user to a workspace with a given role (e.g. ADMIN, EDITOR, VIEWER).
  create(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole,
    client: Db = db,
  ): Promise<WorkspaceMember> {
    return client.workspaceMember.create({
      data: { workspaceId, userId, role }, // Associate the user with the workspace and assign their role.
    });
  },

  // All members of a workspace, with their user info attached, ordered ADMIN first then by members by joining date. Workspace membership lists are small (no cursor pagination needed, unlike projects/artifacts).

  list(workspaceId: string): Promise<WorkspaceMemberWithUser[]> {
    return db.workspaceMember.findMany({
      where: { workspaceId },
      orderBy: [{ role: "asc" }, { invitedAt: "asc" }], // ordered by role first then by members by joining date
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    });
  },

  // Change a member's role.
  updateRole(workspaceId: string, userId: string, role: WorkspaceRole): Promise<WorkspaceMember> {
    return db.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId, userId } },
      data: { role },
    });
  },

  // Remove a member from a workspace entirely.
  remove(workspaceId: string, userId: string): Promise<WorkspaceMember> {
    return db.workspaceMember.delete({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
  },

  // Counts how many ADMINs are currently in the workspace. This is used to make sure we never remove or demote the last remaining ADMIN.
  countAdmins(workspaceId: string): Promise<number> {
    return db.workspaceMember.count({
      where: { workspaceId, role: "ADMIN" },
    });
  },
};
