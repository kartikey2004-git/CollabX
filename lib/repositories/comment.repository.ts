import db from "../db";
import type { Comment, Prisma } from "../db";
import { buildKeysetWhere, decodeCursor, paginateResults } from "../pagination";

// Either the normal database client, or a transaction client.
type Db = typeof db | Prisma.TransactionClient;

// Comment belongs to exactly one of Article/TechRead (DB-level CHECK constraint — see
// schema.prisma's comment on this model), same exactly-one-of pattern as Submission.
export type CommentParentType = "article" | "techRead";

function parentWhere(parentType: CommentParentType, parentId: string) {
  return parentType === "article" ? { articleId: parentId } : { techReadId: parentId };
}

export interface ListCommentsParams {
  parentType: CommentParentType;
  parentId: string;
  cursor?: string;
  limit: number;
}

export const commentRepository = {
  create(
    data: {
      parentType: CommentParentType;
      parentId: string;
      userId: string;
      body: string;
      parentCommentId?: string;
    },
    client: Db = db,
  ): Promise<Comment> {
    return client.comment.create({
      data: {
        ...parentWhere(data.parentType, data.parentId),
        userId: data.userId,
        body: data.body,
        parentCommentId: data.parentCommentId,
      },
    });
  },

  findById(id: string): Promise<Comment | null> {
    return db.comment.findFirst({ where: { id, deletedAt: null } });
  },

  // Used to validate that a `parentCommentId` supplied on create actually belongs to the same
  // article/techRead being commented on (defense-in-depth alongside the DB's own CHECK constraint).
  findByIdIncludingDeleted(id: string): Promise<Comment | null> {
    return db.comment.findUnique({ where: { id } });
  },

  // Whether this comment currently has any non-deleted replies — used to decide whether a
  // soft-delete would otherwise "orphan" visible replies (informational only; the DB's `Restrict`
  // FK on parentCommentId means a HARD delete is physically refused regardless, but this app never
  // attempts a hard delete in the first place — see comment.service.ts).
  async hasReplies(id: string): Promise<boolean> {
    const count = await db.comment.count({ where: { parentCommentId: id } });
    return count > 0;
  },

  // Flat list, newest first — matches the schema's own
  // `@@index([articleId, createdAt(sort: Desc)])` / `@@index([techReadId, createdAt(sort: Desc)])`.
  // Soft-deleted comments are still returned (so their replies aren't orphaned in the UI) with
  // their body intact at the repository layer; the service/frontend layer is responsible for
  // rendering a "[deleted]" placeholder instead of the body when deletedAt is set.
  async list(params: ListCommentsParams) {
    const cursor = params.cursor ? decodeCursor(params.cursor) : undefined;
    const keysetWhere = buildKeysetWhere("createdAt", "desc", cursor);

    const where = {
      ...parentWhere(params.parentType, params.parentId),
      ...(keysetWhere ?? {}),
    } as Prisma.CommentWhereInput;

    const rows = await db.comment.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: params.limit + 1,
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return paginateResults(rows, params.limit, "createdAt");
  },

  softDelete(id: string): Promise<Comment> {
    return db.comment.update({ where: { id }, data: { deletedAt: new Date() } });
  },
};
