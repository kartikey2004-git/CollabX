import { NextFunction, Request, Response } from "express";
import type {
  ArticleIdParam,
  CreateCommentInput,
  ListCommentsQuery,
  TechReadIdParam,
} from "@repo/validation";
import type { Role } from "@repo/database";
import { commentService } from "../services/comment.service";
import type { CommentParentType } from "../repositories/comment.repository";
import { sendSuccess } from "../lib/response";

// Shared by both the /articles/:articleId/comments and /tech-reads/:techReadId/comments nested
// routers — same factory-function pattern as submission.controller.ts's
// `createSubmissionController`.
export function createCommentController(parentType: CommentParentType) {
  return {
    async create(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const parentId =
          parentType === "article"
            ? (req.params as unknown as ArticleIdParam).articleId
            : (req.params as unknown as TechReadIdParam).techReadId;

        const input = req.body as CreateCommentInput;
        const comment = await commentService.create(parentType, parentId, req.user!.id, input);
        sendSuccess(res, comment, { status: 201 });
      } catch (err) {
        next(err);
      }
    },

    async list(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const parentId =
          parentType === "article"
            ? (req.params as unknown as ArticleIdParam).articleId
            : (req.params as unknown as TechReadIdParam).techReadId;

        const query = req.query as unknown as ListCommentsQuery;
        const { items, nextCursor, hasMore } = await commentService.list(parentType, parentId, query);
        sendSuccess(res, items, { meta: { nextCursor, hasMore } });
      } catch (err) {
        next(err);
      }
    },
  };
}

// Direct /comments/:id routes.
export const commentController = {
  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const requester = { id: req.user!.id, role: req.user!.role as Role };
      const comment = await commentService.delete(id, requester);
      sendSuccess(res, comment);
    } catch (err) {
      next(err);
    }
  },
};
