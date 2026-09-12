import db from "@repo/database";
import type { Article, Category, ContentStatus, Prisma } from "@repo/database";
import { buildKeysetWhere, decodeCursor, paginateResults } from "../lib/pagination";

// Either the normal database client, or a transaction client (used when several database calls
// need to succeed or fail together).
type Db = typeof db | Prisma.TransactionClient;

export type ArticleSortField = "createdAt" | "updatedAt" | "title" | "publishedAt";

export interface ListPublishedArticlesParams {
  category?: Category;
  cursor?: string;
  limit: number;
  sortBy: ArticleSortField;
  sortOrder: "asc" | "desc";
}

// `createdBy` is only set when scoping to one contributor's own articles ("my articles"). When
// omitted, the caller is an ADMIN who sees every non-deleted article regardless of owner.
export interface ListArticlesAdminParams {
  createdBy?: string;
  status?: ContentStatus;
  category?: Category;
  cursor?: string;
  limit: number;
  sortBy: ArticleSortField;
  sortOrder: "asc" | "desc";
}

export const articleRepository = {
  // Insert the Article envelope row. Called only from within articleService.create's transaction,
  // alongside the matching v1 Submission — see that service for why title/summary are populated
  // here even though they're also denormalized-from-currentSubmission on every future publish.
  create(
    data: {
      slug: string;
      category: Category;
      title: string;
      summary?: string;
      createdBy: string;
    },
    client: Db = db,
  ): Promise<Article> {
    return client.article.create({ data });
  },

  // Fetch one article by id, excluding soft-deleted rows. `includeCurrentSubmission` joins in the
  // full Markdown body (needed for a single-article "reader" view) — list endpoints never need it,
  // since title/summary/status are already denormalized onto the Article row itself.
  findById(id: string, opts?: { includeCurrentSubmission?: boolean }) {
    return db.article.findFirst({
      where: { id, deletedAt: null },
      include: opts?.includeCurrentSubmission ? { currentSubmission: true } : undefined,
    });
  },

  findBySlug(slug: string, opts?: { includeCurrentSubmission?: boolean }) {
    return db.article.findFirst({
      where: { slug, deletedAt: null },
      include: opts?.includeCurrentSubmission ? { currentSubmission: true } : undefined,
    });
  },

  // Used by slug generation to find the next free `title-2`, `title-3`, ... suffix.
  async slugExists(slug: string): Promise<boolean> {
    const count = await db.article.count({ where: { slug } });
    return count > 0;
  },

  // Look up the owning contributor's id (used for ownership checks in submission.service.ts
  // without needing to fetch/deserialize the whole row).
  async findOwnerId(id: string): Promise<string | null> {
    const article = await db.article.findFirst({
      where: { id, deletedAt: null },
      select: { createdBy: true },
    });
    return article?.createdBy ?? null;
  },

  // Public listing: PUBLISHED-only, optionally filtered by category, cursor-paginated. This is the
  // only listing query unauthenticated-equivalent readers ever hit.
  async findPublished(params: ListPublishedArticlesParams) {
    const cursor = params.cursor ? decodeCursor(params.cursor) : undefined;
    const keysetWhere = buildKeysetWhere(params.sortBy, params.sortOrder, cursor);

    const where = {
      status: "PUBLISHED",
      deletedAt: null,
      ...(params.category ? { category: params.category } : {}),
      ...(keysetWhere ?? {}),
    } as Prisma.ArticleWhereInput;

    const orderBy = [
      { [params.sortBy]: params.sortOrder },
      { id: params.sortOrder },
    ] as Prisma.ArticleOrderByWithRelationInput[];

    const rows = await db.article.findMany({ where, orderBy, take: params.limit + 1 });
    return paginateResults(rows, params.limit, params.sortBy);
  },

  // "My articles" (createdBy set) or the admin moderation listing (createdBy omitted — every
  // non-deleted article, any status). Both share this one query shape; which mode applies is
  // decided by article.service.ts based on the caller's role, never by client input.
  async findForOwnerOrAdmin(params: ListArticlesAdminParams) {
    const cursor = params.cursor ? decodeCursor(params.cursor) : undefined;
    const keysetWhere = buildKeysetWhere(params.sortBy, params.sortOrder, cursor);

    const where = {
      deletedAt: null,
      ...(params.createdBy ? { createdBy: params.createdBy } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.category ? { category: params.category } : {}),
      ...(keysetWhere ?? {}),
    } as Prisma.ArticleWhereInput;

    const orderBy = [
      { [params.sortBy]: params.sortOrder },
      { id: params.sortOrder },
    ] as Prisma.ArticleOrderByWithRelationInput[];

    const rows = await db.article.findMany({ where, orderBy, take: params.limit + 1 });
    return paginateResults(rows, params.limit, params.sortBy);
  },

  /*

  The one place Article's status/currentSubmissionId/title/summary/publishedAt are ever written
  after creation — called only from inside submission.service.ts's publish transaction. This is
  intentionally the ONLY update path into these fields (see schema.prisma's comment on
  Article.createdBy and 002-architecture-impact.md): there is no general-purpose
  `articleRepository.update()` that a controller could wire up to let a contributor edit these
  columns directly.

  */
  publishWithSubmission(
    id: string,
    data: { currentSubmissionId: string; title: string; summary?: string | null },
    client: Db = db,
  ): Promise<Article> {
    return client.article.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        currentSubmissionId: data.currentSubmissionId,
        title: data.title,
        summary: data.summary,
        publishedAt: new Date(),
      },
    });
  },

  softDelete(id: string, client: Db = db): Promise<Article> {
    return client.article.update({ where: { id }, data: { deletedAt: new Date() } });
  },
};
