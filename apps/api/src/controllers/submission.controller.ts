import { NextFunction, Request, Response } from "express";
import type {
  ArticleIdParam,
  CreateSubmissionInput,
  ListIndexableQuery,
  ReviewSubmissionInput,
  SubmissionHistoryQuery,
  SubmissionQueueQuery,
  TechReadIdParam,
} from "@repo/validation";
import type { Role } from "@repo/database";
import { submissionService } from "../services/submission.service";
import type { ParentType } from "../repositories/submission.repository";
import { sendSuccess } from "../lib/response";

// Shared by both the /articles/:articleId/submissions and /tech-reads/:techReadId/submissions
// nested routers — see submission.routes.ts's `createNestedSubmissionRouter` factory.
export function createSubmissionController(parentType: ParentType) {
  return {
    async createNewVersion(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const parentId =
          parentType === "article"
            ? (req.params as unknown as ArticleIdParam).articleId
            : (req.params as unknown as TechReadIdParam).techReadId;

        const input = req.body as CreateSubmissionInput;
        const requester = { id: req.user!.id, role: req.user!.role as Role };

        const submission = await submissionService.createNewVersion(
          parentType,
          parentId,
          requester,
          input,
        );
        sendSuccess(res, submission, { status: 201 });
      } catch (err) {
        next(err);
      }
    },

    async listHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
      try {
        const parentId =
          parentType === "article"
            ? (req.params as unknown as ArticleIdParam).articleId
            : (req.params as unknown as TechReadIdParam).techReadId;

        const query = req.query as unknown as SubmissionHistoryQuery;
        const requester = { id: req.user!.id, role: req.user!.role as Role };

        const { items, nextCursor, hasMore } = await submissionService.listHistory(
          parentType,
          parentId,
          requester,
          query,
        );
        sendSuccess(res, items, { meta: { nextCursor, hasMore } });
      } catch (err) {
        next(err);
      }
    },
  };
}

// Direct /submissions/:id routes — not parent-type-specific.
export const submissionController = {
  async submitForReview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const requester = { id: req.user!.id, role: req.user!.role as Role };
      const submission = await submissionService.submitForReview(id, requester);
      sendSuccess(res, submission);
    } catch (err) {
      next(err);
    }
  },

  async review(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const input = req.body as ReviewSubmissionInput;
      const submission = await submissionService.review(id, req.user!.id, input);
      sendSuccess(res, submission);
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const requester = { id: req.user!.id, role: req.user!.role as Role };
      const submission = await submissionService.getById(id, requester);
      sendSuccess(res, submission);
    } catch (err) {
      next(err);
    }
  },

  async listQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as SubmissionQueueQuery;
      const { items, nextCursor, hasMore } = await submissionService.listQueue(query);
      sendSuccess(res, items, { meta: { nextCursor, hasMore } });
    } catch (err) {
      next(err);
    }
  },

  async listIndexable(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as ListIndexableQuery;
      const { items, nextCursor, hasMore } = await submissionService.listIndexable(query);
      sendSuccess(res, items, { meta: { nextCursor, hasMore } });
    } catch (err) {
      next(err);
    }
  },

  async reindex(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const submission = await submissionService.reindex(id);
      sendSuccess(res, submission);
    } catch (err) {
      next(err);
    }
  },
};
