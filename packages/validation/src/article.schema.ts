import { z } from "zod";
import {
  contentStatusSchema,
  markdownContentSchema,
  paginationQuerySchema,
  sortOrderSchema,
  summarySchema,
  titleSchema,
} from "./common.schema";
import { categorySchema } from "./category.schema";

// Creates an Article + its initial (v1) Submission together in one call — see
// articleService.create. `category` is required for Article (unlike TechRead, where it's
// optional), matching the schema's own `Category` field being non-nullable on `Article`.

export const createArticleSchema = z.object({
  title: titleSchema,
  summary: summarySchema,
  category: categorySchema,
  content: markdownContentSchema,
});

// Public listing (GET /articles): always PUBLISHED-only, enforced in the service — not accepted
// as a client-supplied filter here, since letting a client pass `status=DRAFT` would let any
// authenticated reader browse everyone's unpublished drafts by guessing/filtering. Sortable by
// publishedAt (default — newest published first) or by title/createdAt.

export const listArticlesQuerySchema = paginationQuerySchema.extend({
  category: categorySchema.optional(),
  sortBy: z.enum(["publishedAt", "createdAt", "title"]).default("publishedAt"),
  sortOrder: sortOrderSchema,
});

// "My articles" (CONTRIBUTOR, scoped to their own createdBy) / admin moderation listing (ADMIN,
// sees everything) — a single query shape shared by both, since the only behavioral difference is
// which `createdBy` the service scopes to, decided server-side from the caller's role, never from
// a client-supplied field. `status` here IS client-controllable, unlike the public listing above,
// because this endpoint is only reachable by the content's own owner or an ADMIN in the first
// place (see article.service.ts / article.routes.ts).

export const listArticlesAdminQuerySchema = paginationQuerySchema.extend({
  status: contentStatusSchema.optional(),
  category: categorySchema.optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "title"]).default("createdAt"),
  sortOrder: sortOrderSchema,
});

export const articleSlugParamSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(250, "Slug must be at most 250 characters"),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type ListArticlesQuery = z.infer<typeof listArticlesQuerySchema>;
export type ListArticlesAdminQuery = z.infer<typeof listArticlesAdminQuerySchema>;
export type ArticleSlugParam = z.infer<typeof articleSlugParamSchema>;
