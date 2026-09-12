import { NextFunction, Request, Response } from "express";
import type {
  ArticleSlugParam,
  CreateTechReadInput,
  ListTechReadsAdminQuery,
  ListTechReadsQuery,
  UpdateTechReadTrendingInput,
} from "@repo/validation";
import type { Role } from "@repo/database";
import { techReadService } from "../services/tech-read.service";
import { sendSuccess } from "../lib/response";
import { requesterFrom } from "../lib/requester";

export const techReadController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateTechReadInput;
      const result = await techReadService.create(req.user!.id, input);
      sendSuccess(res, result, { status: 201 });
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as ListTechReadsQuery;
      const { items, nextCursor, hasMore } = await techReadService.list(query);
      sendSuccess(res, items, { meta: { nextCursor, hasMore } });
    } catch (err) {
      next(err);
    }
  },

  async listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as ListTechReadsAdminQuery;
      const requester = { id: req.user!.id, role: req.user!.role as Role };
      const { items, nextCursor, hasMore } = await techReadService.listMine(requester, query);
      sendSuccess(res, items, { meta: { nextCursor, hasMore } });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const techRead = await techReadService.getById(id, requesterFrom(req));
      sendSuccess(res, techRead);
    } catch (err) {
      next(err);
    }
  },

  async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params as unknown as ArticleSlugParam;
      const techRead = await techReadService.getBySlug(slug, requesterFrom(req));
      sendSuccess(res, techRead);
    } catch (err) {
      next(err);
    }
  },

  async updateTrending(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const input = req.body as UpdateTechReadTrendingInput;
      const techRead = await techReadService.updateTrending(id, input);
      sendSuccess(res, techRead);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const techRead = await techReadService.delete(id);
      sendSuccess(res, techRead);
    } catch (err) {
      next(err);
    }
  },
};
