import db from "@repo/database";
import type { Prisma, Project } from "@repo/database";
import {
  buildKeysetWhere,
  decodeCursor,
  paginateResults,
} from "../lib/pagination";

// Which fields a project list can be sorted by.
export type ProjectSortField = "createdAt" | "updatedAt" | "name";

export interface ListProjectsParams {
  workspaceId: string;
  cursor?: string;
  limit: number;
  sortBy: ProjectSortField;
  sortOrder: "asc" | "desc";
}

// Either the normal database client, or a transaction client (used when several database calls need to succeed or fail together).

type Db = typeof db | Prisma.TransactionClient;

// projectRepository object is the only place that talks directly to the "Project" table in the database. Controllers/services call these functions instead of writing raw Prisma queries themselves.

export const projectRepository = {
  
  // Insert a new project row into the database.
  create(data: {
    name: string;
    description?: string;
    slug: string;
    workspaceId: string;
    createdBy: string;
  }): Promise<Project> {
    return db.project.create({ data });
  },

  // Update an existing project's name/description.
  update(
    id: string,
    data: { name?: string; description?: string; updatedBy: string },
  ): Promise<Project> {
    return db.project.update({ where: { id }, data });
  },

  // "Delete" a project without actually removing the row — just mark it as deleted by setting deletedAt, so it can potentially be restored later.
  softDelete(id: string, client: Db = db): Promise<Project> {
    return client.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  // Find one project by id, but only if it hasn't been soft-deleted.
  findById(id: string): Promise<Project | null> {
    return db.project.findFirst({ where: { id, deletedAt: null } });
  },

  // Look up which workspace a given project belongs to (used by RBAC checks).
  async findWorkspaceIdById(id: string): Promise<string | null> {
    const project = await db.project.findFirst({
      where: { id, deletedAt: null },
      select: { workspaceId: true },
    });
    return project?.workspaceId ?? null;
  },

  // true/false check for whether a (non-deleted) project exists.
  async exists(id: string): Promise<boolean> {
    const count = await db.project.count({ where: { id, deletedAt: null } });
    return count > 0;
  },

  // Get one page of projects belonging to a workspace, with cursor-based pagination.
  async findByWorkspace(params: ListProjectsParams) {

    // Turn the incoming cursor string (if any) back into a usable value.
    const cursor = params.cursor ? decodeCursor(params.cursor) : undefined;
    
    // Build the "give me rows after this cursor" filter.
    const keysetWhere = buildKeysetWhere(
      params.sortBy,
      params.sortOrder,
      cursor,
    );

    // Only look at projects in this workspace that aren't soft-deleted.
    const where = {
      workspaceId: params.workspaceId,
      deletedAt: null,
      ...(keysetWhere ?? {}),
    } as Prisma.ProjectWhereInput;

    // Sort by the requested field, breaking ties by id for stable pagination.
    const orderBy = [
      { [params.sortBy]: params.sortOrder },
      { id: params.sortOrder },
    ] as Prisma.ProjectOrderByWithRelationInput[];

    // Fetch one extra row beyond the limit so we can tell if there's a next page.
    const rows = await db.project.findMany({
      where,
      orderBy,
      take: params.limit + 1,
    });

    return paginateResults(rows, params.limit, params.sortBy);
  },
};
