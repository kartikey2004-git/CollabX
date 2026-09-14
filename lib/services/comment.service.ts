import type { Comment, Role } from "../db";
import type { CreateCommentInput } from "../validation";
import { commentRepository, type CommentParentType } from "../repositories/comment.repository";
import { articleRepository } from "../repositories/article.repository";
import { techReadRepository } from "../repositories/tech-read.repository";
import { sanitizeMarkdownText } from "./markdown.service";
import { ForbiddenError, NotFoundError, ValidationError } from "../errors";

async function assertParentIsPublished(parentType: CommentParentType, parentId: string): Promise<void> {
  const parent =
    parentType === "article"
      ? await articleRepository.findById(parentId)
      : await techReadRepository.findById(parentId);

  if (!parent) {
    throw new NotFoundError(parentType === "article" ? "Article not found" : "Tech read not found");
  }

  // Commenting on unpublished content makes no sense and would leak the existence/content of a
  // draft to non-owners who otherwise couldn't see it — enforced here rather than relying on the
  // frontend to only ever render a comment box on published pages.
  if (parent.status !== "PUBLISHED") {
    throw new ForbiddenError("Comments can only be added to published content");
  }
}

export const commentService = {
  async create(
    parentType: CommentParentType,
    parentId: string,
    userId: string,
    input: CreateCommentInput,
  ): Promise<Comment> {
    await assertParentIsPublished(parentType, parentId);

    // If replying to another comment, it must belong to the same article/techRead — defense in
    // depth alongside the DB's exactly-one-of CHECK constraint, and prevents a reply from being
    // filed under the wrong thread entirely.
    if (input.parentCommentId) {
      const parentComment = await commentRepository.findByIdIncludingDeleted(input.parentCommentId);
      if (!parentComment) {
        throw new ValidationError("Request validation failed", [
          { path: "body.parentCommentId", message: "Parent comment not found" },
        ]);
      }

      const belongsToSameParent =
        parentType === "article"
          ? parentComment.articleId === parentId
          : parentComment.techReadId === parentId;

      if (!belongsToSameParent) {
        throw new ValidationError("Request validation failed", [
          {
            path: "body.parentCommentId",
            message: "Parent comment does not belong to the same article/tech read",
          },
        ]);
      }
    }

    return commentRepository.create({
      parentType,
      parentId,
      userId,
      body: sanitizeMarkdownText(input.body),
      parentCommentId: input.parentCommentId,
    });
  },

  // Flat, newest-first list — threading (grouping replies under parents) is left to the frontend,
  // which already has `parentCommentId` on every row to build a tree client-side. Kept flat here
  // deliberately: a recursive/nested response shape adds real complexity (arbitrary depth, N+1
  // risk) for no backend-side benefit, since every consumer already needs the full flat list to
  // build any UI shape anyway.
  //
  // Security fix (006-security-and-rbac.md): the repository intentionally still returns
  // soft-deleted rows (so a deleted comment's live replies aren't orphaned client-side), but it
  // must NOT still return the deleted comment's original text — the frontend's "[deleted]"
  // placeholder (components/comments/comment-item.tsx) is a rendering convention, not a security
  // boundary, and a deleted comment could contain something the author/an admin specifically
  // wanted removed (PII, harassment, etc.). Redacting `body` here, at the service boundary right
  // before the controller sends the response, means any client (including one bypassing the
  // frontend entirely, e.g. curl/devtools) can never read a deleted comment's real text again.
  async list(parentType: CommentParentType, parentId: string, query: { cursor?: string; limit: number }) {
    // Comments are only ever created on PUBLISHED content (create() enforces this above), so in
    // practice unpublished content never has any comments to begin with — but this route is now
    // reachable by anonymous callers (see comment.routes.ts), so check explicitly rather than
    // relying on that invariant to keep holding forever. Same NotFoundError/ForbiddenError this
    // throws as assertParentIsPublished's other caller.
    await assertParentIsPublished(parentType, parentId);

    const result = await commentRepository.list({
      parentType,
      parentId,
      cursor: query.cursor,
      limit: query.limit,
    });

    return {
      ...result,
      items: result.items.map((comment) =>
        comment.deletedAt ? { ...comment, body: "" } : comment,
      ),
    };
  },

  // Soft-delete only — the comment's own author or an ADMIN. Never a hard delete: a parent comment
  // with live replies is physically refused by the DB's `Restrict` FK on parentCommentId (see
  // schema.prisma's comment on this model), so soft-delete is the only removal path that could ever
  // work uniformly regardless of whether a comment has replies.
  async delete(id: string, requester: { id: string; role: Role }): Promise<Comment> {
    const comment = await commentRepository.findById(id);
    if (!comment) {
      throw new NotFoundError("Comment not found");
    }

    if (comment.userId !== requester.id && requester.role !== "ADMIN") {
      throw new ForbiddenError("Only the comment's author or an admin may delete it");
    }

    return commentRepository.softDelete(id);
  },
};
