import db from "../db";
import type { Category, ContentStatus, Prisma, TechRead } from "../db";
import { buildKeysetWhere, decodeCursor, paginateResults } from "../pagination";

// Either the normal database client, or a transaction client (used when several database calls
// need to succeed or fail together).
type Db = typeof db | Prisma.TransactionClient;

export type TechReadSortField = "createdAt" | "updatedAt" | "title" | "publishedAt";

export interface ListPublishedTechReadsParams {
  category?: Category;
  cursor?: string;
  limit: number;
  sortBy: TechReadSortField;
  sortOrder: "asc" | "desc";
}

export interface ListTechReadsAdminParams {
  createdBy?: string;
  status?: ContentStatus;
  category?: Category;
  cursor?: string;
  limit: number;
  sortBy: TechReadSortField;
  sortOrder: "asc" | "desc";
}

export const techReadRepository = {
  create(
    data: {
      slug: string;
      title: string;
      description?: string;
      externalUrl: string;
      sourceName?: string;
      category?: Category;
      tags?: string[];
      createdBy: string;
    },
    client: Db = db,
  ): Promise<TechRead> {
    return client.techRead.create({
      data: {
        slug: data.slug,
        title: data.title,
        description: data.description,
        externalUrl: data.externalUrl,
        sourceName: data.sourceName,
        category: data.category,
        tags: data.tags ?? [],
        createdBy: data.createdBy,
      },
    });
  },

  findById(id: string, opts?: { includeCurrentSubmission?: boolean }) {
    return db.techRead.findFirst({
      where: { id, deletedAt: null },
      include: opts?.includeCurrentSubmission ? { currentSubmission: true } : undefined,
    });
  },

  findBySlug(slug: string, opts?: { includeCurrentSubmission?: boolean }) {
    return db.techRead.findFirst({
      where: { slug, deletedAt: null },
      include: opts?.includeCurrentSubmission ? { currentSubmission: true } : undefined,
    });
  },

  async slugExists(slug: string): Promise<boolean> {
    const count = await db.techRead.count({ where: { slug } });
    return count > 0;
  },

  async findOwnerId(id: string): Promise<string | null> {
    const techRead = await db.techRead.findFirst({
      where: { id, deletedAt: null },
      select: { createdBy: true },
    });
    return techRead?.createdBy ?? null;
  },

  // Public listing: PUBLISHED-only.
  async findPublished(params: ListPublishedTechReadsParams) {
    const cursor = params.cursor ? decodeCursor(params.cursor) : undefined;
    const keysetWhere = buildKeysetWhere(params.sortBy, params.sortOrder, cursor);

    const where = {
      status: "PUBLISHED",
      deletedAt: null,
      ...(params.category ? { category: params.category } : {}),
      ...(keysetWhere ?? {}),
    } as Prisma.TechReadWhereInput;

    const orderBy = [
      { [params.sortBy]: params.sortOrder },
      { id: params.sortOrder },
    ] as Prisma.TechReadOrderByWithRelationInput[];

    const rows = await db.techRead.findMany({ where, orderBy, take: params.limit + 1 });
    return paginateResults(rows, params.limit, params.sortBy);
  },

  async findForOwnerOrAdmin(params: ListTechReadsAdminParams) {
    const cursor = params.cursor ? decodeCursor(params.cursor) : undefined;
    const keysetWhere = buildKeysetWhere(params.sortBy, params.sortOrder, cursor);

    const where = {
      deletedAt: null,
      ...(params.createdBy ? { createdBy: params.createdBy } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.category ? { category: params.category } : {}),
      ...(keysetWhere ?? {}),
    } as Prisma.TechReadWhereInput;

    const orderBy = [
      { [params.sortBy]: params.sortOrder },
      { id: params.sortOrder },
    ] as Prisma.TechReadOrderByWithRelationInput[];

    const rows = await db.techRead.findMany({ where, orderBy, take: params.limit + 1 });
    return paginateResults(rows, params.limit, params.sortBy);
  },

  // The one path into status/currentSubmissionId/title/description/publishedAt after creation —
  // called only from submission.service.ts's publish transaction. Same rationale as
  // articleRepository.publishWithSubmission.
  publishWithSubmission(
    id: string,
    data: { currentSubmissionId: string; title: string; description?: string | null },
    client: Db = db,
  ): Promise<TechRead> {
    return client.techRead.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        currentSubmissionId: data.currentSubmissionId,
        title: data.title,
        description: data.description,
        publishedAt: new Date(),
      },
    });
  },

  softDelete(id: string, client: Db = db): Promise<TechRead> {
    return client.techRead.update({ where: { id }, data: { deletedAt: new Date() } });
  },
};
