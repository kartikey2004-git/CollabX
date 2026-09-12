import { NextFunction, Request, Response } from "express";
import type {
  ArticleSlugParam,
  CreateArticleInput,
  ListArticlesAdminQuery,
  ListArticlesQuery,
} from "@repo/validation";
import type { Role } from "@repo/database";
import { articleService } from "../services/article.service";
import { sendSuccess } from "../lib/response";
import { requesterFrom } from "../lib/requester";

export const articleController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as CreateArticleInput;
      const result = await articleService.create(req.user!.id, input);
      sendSuccess(res, result, { status: 201 });
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as ListArticlesQuery;
      const { items, nextCursor, hasMore } = await articleService.list(query);
      sendSuccess(res, items, { meta: { nextCursor, hasMore } });
    } catch (err) {
      next(err);
    }
  },

  async listMine(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as ListArticlesAdminQuery;
      const requester = { id: req.user!.id, role: req.user!.role as Role };
      const { items, nextCursor, hasMore } = await articleService.listMine(requester, query);
      sendSuccess(res, items, { meta: { nextCursor, hasMore } });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const article = await articleService.getById(id, requesterFrom(req));
      sendSuccess(res, article);
    } catch (err) {
      next(err);
    }
  },

  async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params as unknown as ArticleSlugParam;
      const article = await articleService.getBySlug(slug, requesterFrom(req));
      sendSuccess(res, article);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const article = await articleService.delete(id);
      sendSuccess(res, article);
    } catch (err) {
      next(err);
    }
  },
};
