import db from "../db";
import type { ContentStatus, Prisma, Submission } from "../db";
import { buildKeysetWhere, decodeCursor, paginateResults } from "../pagination";

// Either the normal database client, or a transaction client (used when several database calls
// need to succeed or fail together).
type Db = typeof db | Prisma.TransactionClient;

// Submission belongs to exactly one of Article/TechRead (enforced by a DB-level CHECK constraint —
// see schema.prisma's comment on this model). Every repository method here takes an explicit
// `parentType` + `parentId` pair instead of two separate nullable ids, so callers can't
// accidentally set both or neither.
export type ParentType = "article" | "techRead";

function parentWhere(parentType: ParentType, parentId: string) {
  return parentType === "article" ? { articleId: parentId } : { techReadId: parentId };
}

export type SubmissionSortField = "version" | "createdAt" | "submittedAt";

export interface SubmissionHistoryParams {
  parentType: ParentType;
  parentId: string;
  cursor?: string;
  limit: number;
  sortBy: SubmissionSortField;
  sortOrder: "asc" | "desc";
}

export interface SubmissionQueueParams {
  status: ContentStatus;
  cursor?: string;
  limit: number;
}

export const submissionRepository = {
  // Insert the next version. `version` must already be computed by the caller (see
  // submission.service.ts) inside the same transaction as this insert — the
  // `@@unique([articleId, version])` / `@@unique([techReadId, version])` constraints are the real
  // safety net against a concurrent race, not this function.
  create(
    data: {
      parentType: ParentType;
      parentId: string;
      version: number;
      title: string;
      summary?: string;
      content: string;
      submittedBy: string;
      status?: "DRAFT" | "PENDING_REVIEW";
    },
    client: Db = db,
  ): Promise<Submission> {
    return client.submission.create({
      data: {
        ...parentWhere(data.parentType, data.parentId),
        version: data.version,
        title: data.title,
        summary: data.summary,
        content: data.content,
        submittedBy: data.submittedBy,
        status: data.status ?? "DRAFT",
      },
    });
  },

  findById(id: string, client: Db = db): Promise<Submission | null> {
    return client.submission.findUnique({ where: { id } });
  },

  // In-place edit of a DRAFT/PENDING_REVIEW submission's own fields — never touches status,
  // version, or the parent Article/TechRead (see submission.service.ts's `update`).
  update(
    id: string,
    data: { title?: string; summary?: string; content?: string },
    client: Db = db,
  ): Promise<Submission> {
    return client.submission.update({ where: { id }, data });
  },

  // The current highest version number for this parent, or null if it has no submissions yet.
  async findLatestVersionNumber(
    parentType: ParentType,
    parentId: string,
    client: Db = db,
  ): Promise<number | null> {
    const latest = await client.submission.findFirst({
      where: parentWhere(parentType, parentId),
      orderBy: { version: "desc" },
      select: { version: true },
    });
    return latest?.version ?? null;
  },

  // How many submissions against this parent are still "in flight" (DRAFT or PENDING_REVIEW).
  // Used to enforce the one-in-flight-submission-per-parent rule — see submission.service.ts.
  countActive(parentType: ParentType, parentId: string): Promise<number> {
    return db.submission.count({
      where: { ...parentWhere(parentType, parentId), status: { in: ["DRAFT", "PENDING_REVIEW"] } },
    });
  },

  // DRAFT -> PENDING_REVIEW. Sets submittedAt so the moderation queue's
  // `@@index([status, submittedAt])` ordering has a real value to sort by.
  markPendingReview(id: string, client: Db = db): Promise<Submission> {
    return client.submission.update({
      where: { id },
      data: { status: "PENDING_REVIEW", submittedAt: new Date() },
    });
  },

  markPublished(id: string, reviewedBy: string, client: Db = db): Promise<Submission> {
    return client.submission.update({
      where: { id },
      data: { status: "PUBLISHED", reviewedBy, reviewedAt: new Date() },
    });
  },

  markRejected(
    id: string,
    reviewedBy: string,
    rejectionReason: string,
    client: Db = db,
  ): Promise<Submission> {
    return client.submission.update({
      where: { id },
      data: { status: "REJECTED", reviewedBy, reviewedAt: new Date(), rejectionReason },
    });
  },

  // The admin moderation queue: a given status (PENDING_REVIEW by default), newest submittedAt
  // first — matches schema.prisma's own `@@index([status, submittedAt])` comment describing this
  // exact query. (A B-tree index serves a descending scan just as well as ascending.)
  async findQueue(params: SubmissionQueueParams) {
    const cursor = params.cursor ? decodeCursor(params.cursor) : undefined;
    const keysetWhere = buildKeysetWhere("submittedAt", "desc", cursor);

    const where = {
      status: params.status,
      ...(keysetWhere ?? {}),
    } as Prisma.SubmissionWhereInput;

    const rows = await db.submission.findMany({
      where,
      orderBy: [{ submittedAt: "desc" }, { id: "desc" }],
      take: params.limit + 1,
    });

    return paginateResults(rows, params.limit, "submittedAt");
  },

  // Full version history for one Article/TechRead (every status, including DRAFT/REJECTED) —
  // visibility (owner/ADMIN only) is enforced by the caller, this just fetches the page.
  async findHistory(params: SubmissionHistoryParams) {
    const cursor = params.cursor ? decodeCursor(params.cursor) : undefined;
    const keysetWhere = buildKeysetWhere(params.sortBy, params.sortOrder, cursor);

    const where = {
      ...parentWhere(params.parentType, params.parentId),
      ...(keysetWhere ?? {}),
    } as Prisma.SubmissionWhereInput;

    const orderBy = [
      { [params.sortBy]: params.sortOrder },
      { id: params.sortOrder },
    ] as Prisma.SubmissionOrderByWithRelationInput[];

    const rows = await db.submission.findMany({ where, orderBy, take: params.limit + 1 });
    return paginateResults(rows, params.limit, params.sortBy);
  },
};
