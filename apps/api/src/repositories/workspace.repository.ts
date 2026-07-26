import db from "@repo/database";
import type { Prisma, Workspace, WorkspaceRole } from "@repo/database";
import { buildKeysetWhere, decodeCursor, paginateResults } from "../lib/pagination";

// A workspace + the current user's role in it (e.g. ADMIN, EDITOR, VIEWER).
export type WorkspaceWithRole = Workspace & { role: WorkspaceRole };

// Which fields a workspace list can be sorted by.
export type WorkspaceSortField = "createdAt" | "updatedAt" | "name";

export interface ListWorkspacesParams {
  userId: string;
  cursor?: string;
  limit: number;
  sortBy: WorkspaceSortField;
  sortOrder: "asc" | "desc";
}

// Either the normal database client, or a transaction client (used when several database calls need to succeed or fail together).

type Db = typeof db | Prisma.TransactionClient;

export const workspaceRepository = {
  // Creates a new workspace row, owned by the given user.
  create(data: { name: string; ownerId: string }, client: Db = db): Promise<Workspace> {
    return client.workspace.create({ data }); // create the workspace row in the database with workspace name and id of owner
  },

  // Update an existing workspace's name.
  update(id: string, data: { name: string }): Promise<Workspace> {
    return db.workspace.update({ where: { id }, data });
  },

  // Permanently remove a workspace row (there's no soft-delete for workspaces).
  hardDelete(id: string): Promise<Workspace> {
    return db.workspace.delete({ where: { id } });
  },

  // Find one workspace by its id.
  findById(id: string): Promise<Workspace | null> {
    return db.workspace.findUnique({ where: { id } });
  },

  // true/false check for whether a workspace exists.
  async exists(id: string): Promise<boolean> {
    const count = await db.workspace.count({ where: { id } });
    return count > 0;
  },

  // Get one page of workspaces this user is a member of, with cursor-based pagination.

  async findByMember(params: ListWorkspacesParams) {
    // Turn the incoming cursor string (if any) back into a usable value.
    const cursor = params.cursor ? decodeCursor(params.cursor) : undefined;

    // Build the "give me rows after this cursor" filter.
    const keysetWhere = buildKeysetWhere(params.sortBy, params.sortOrder, cursor);

    // Only look at workspaces where this user is a member.
    const where = {
      members: { some: { userId: params.userId } }, // checks if the user is a member of the workspace

      ...(keysetWhere ?? {}), // builds the keyset where clause for cursor-based pagination
    } as Prisma.WorkspaceWhereInput;

    // Sort by the requested field, breaking ties by id for stable pagination.
    const orderBy = [
      { [params.sortBy]: params.sortOrder }, // sorts by the requested field
      { id: params.sortOrder }, // breaks ties by id for stable pagination
    ] as Prisma.WorkspaceOrderByWithRelationInput[];

    // Fetch one extra row beyond the limit so we can tell if there's a next page.
    const rows = await db.workspace.findMany({
      where,
      orderBy,
      take: params.limit + 1,
      include: {
        members: { where: { userId: params.userId }, select: { role: true } }, // Returns current user's role only (used by frontend to hide edit actions for viewers). Never returns the full member list.
      },
    });

    // Flattens the result by moving the user's role onto the workspace object, instead of keeping it inside the nested "members" relation.
    const withRole: WorkspaceWithRole[] = rows.map((row) => {
      const { members, ...workspace } = row;
      return { ...workspace, role: members[0]!.role };
    });

    return paginateResults(withRole, params.limit, params.sortBy);
  },
};
