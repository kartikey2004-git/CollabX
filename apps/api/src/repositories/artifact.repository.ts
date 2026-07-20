import db from "@repo/database";
import type { Artifact, ArtifactType, Prisma } from "@repo/database";
import {
  buildKeysetWhere,
  decodeCursor,
  paginateResults,
} from "../lib/pagination";

// Which fields an artifact list can be sorted by.
export type ArtifactSortField = "createdAt" | "updatedAt" | "title";

export interface ListArtifactsParams {
  projectId: string;
  cursor?: string;
  limit: number;
  sortBy: ArtifactSortField;
  sortOrder: "asc" | "desc";
  type?: ArtifactType;
}

// Either the normal database client, or a transaction client (used when several database calls need to succeed or fail together).

type Db = typeof db | Prisma.TransactionClient;

// artifactRepository object is the only place that talks directly to the "Artifact" table in the database. Controllers/services call these functions instead of writing raw Prisma queries themselves.

export const artifactRepository = {

  // Insert a new artifact row into the database.
  create(data: {
    title: string;
    type: ArtifactType;
    content: Prisma.InputJsonValue;
    projectId: string;
    parentArtifactId?: string;
    createdBy: string;
  }): Promise<Artifact> {
    return db.artifact.create({ data });
  },

  // Update an existing artifact's title/content.
  update(
    id: string,
    data: {
      title?: string;
      content?: Prisma.InputJsonValue;
      updatedBy: string;
    },
  ): Promise<Artifact> {
    return db.artifact.update({ where: { id }, data });
  },

  // "Delete" one artifact without removing the row — just mark it deleted.
  softDelete(id: string): Promise<Artifact> {
    return db.artifact.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },

  // Soft-delete every artifact under a given project at once (e.g. when the whole project is deleted), and return how many rows were affected.
  async softDeleteManyByProject(
    projectId: string,
    client: Db = db,
  ): Promise<number> {
    const result = await client.artifact.updateMany({
      where: { projectId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return result.count;
  },

  // Find one artifact by id, but only if it hasn't been soft-deleted.
  findById(id: string): Promise<Artifact | null> {
    return db.artifact.findFirst({ where: { id, deletedAt: null } });
  },

  // Look up which project a given artifact belongs to (used by RBAC checks).
  async findProjectIdById(id: string): Promise<string | null> {
    const artifact = await db.artifact.findFirst({
      where: { id, deletedAt: null },
      select: { projectId: true },
    });
    return artifact?.projectId ?? null;
  },

  // true/false check for whether a (non-deleted) artifact exists.
  async exists(id: string): Promise<boolean> {
    const count = await db.artifact.count({ where: { id, deletedAt: null } });
    return count > 0;
  },

  // Get one page of artifacts belonging to a project, with cursor-based pagination.
  async findByProject(params: ListArtifactsParams) {

    // Turn the incoming cursor string (if any) back into a usable value.
    const cursor = params.cursor ? decodeCursor(params.cursor) : undefined;

    // Build the "give me rows after this cursor" filter.
    const keysetWhere = buildKeysetWhere(
      params.sortBy,
      params.sortOrder,
      cursor,
    );

    // Only look at artifacts in this project that aren't soft-deleted, optionally narrowed down further by artifact type.

    const where = {
      projectId: params.projectId,
      deletedAt: null,
      ...(params.type ? { type: params.type } : {}),
      ...(keysetWhere ?? {}),
    } as Prisma.ArtifactWhereInput;

    // Sort by the requested field, breaking ties by id for stable pagination.
    const orderBy = [
      { [params.sortBy]: params.sortOrder },
      { id: params.sortOrder },
    ] as Prisma.ArtifactOrderByWithRelationInput[];

    // Fetch one extra row beyond the limit so we can tell if there's a next page.
    const rows = await db.artifact.findMany({
      where,
      orderBy,
      take: params.limit + 1,
    });

    return paginateResults(rows, params.limit, params.sortBy);
  },
};
