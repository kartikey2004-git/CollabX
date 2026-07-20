import db from "@repo/database";
import type { Prisma, WorkspaceMember, WorkspaceRole } from "@repo/database";

// Either the normal database client, or a transaction client (used when several database calls need to succeed or fail together).

type Db = typeof db | Prisma.TransactionClient;

// workspaceMemberRepository object is the only place that talks directly to the "WorkspaceMember" table — the join table linking users to the workspaces they belong to.

export const workspaceMemberRepository = {
  
  // Find this user's membership row (and role) for a specific workspace. Used everywhere we need to check "is this user allowed in this workspace?".
  
  findByWorkspaceAndUser(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceMember | null> {
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
};
