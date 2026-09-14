import { z } from "zod";

// Shared, reusable pieces of validation used across article/tech-read/submission/comment schemas,
// so URL params, pagination rules, and the content-status/title/summary shapes shared by every
// content type are only defined once.

// Validates that a route param (e.g. /articles/:id) is a real cuid, the id format Prisma
// generates — catches malformed URLs before hitting the database.

export const idParamSchema = z.object({
  id: z.cuid("Invalid id"),
});

export const articleIdParamSchema = z.object({
  articleId: z.cuid("Invalid article id"),
});

export const techReadIdParamSchema = z.object({
  techReadId: z.cuid("Invalid tech read id"),
});

export const submissionIdParamSchema = z.object({
  submissionId: z.cuid("Invalid submission id"),
});

// Shared shape for "list" endpoints: an opaque cursor for pagination, and a page size capped at
// 100 (defaults to 20 if not provided).

export const paginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Whether a list is sorted oldest/lowest-first ("asc") or newest/highest-first ("desc", the default).

export const sortOrderSchema = z.enum(["asc", "desc"]).default("desc");

// The four legal values of ContentStatus (schema.prisma) — shared by Article, TechRead, and
// Submission wherever a status filter/value is accepted from a request.

export const contentStatusSchema = z.enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED", "REJECTED"]);

// Article/TechRead/Submission all share the same "title" and "summary" shape (title is the
// denormalized-from-currentSubmission display name; summary is a short optional blurb), so both
// are defined once here instead of being redefined per resource file.

export const titleSchema = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(200, "Title must be at most 200 characters");

export const summarySchema = z
  .string()
  .trim()
  .max(500, "Summary must be at most 500 characters")
  .optional();

// Submission.content is a Markdown string (`@db.Text` in the schema, so effectively unbounded at
// the DB layer) — a generous but finite cap is enforced here purely to reject obviously-abusive
// payloads (e.g. multi-megabyte bodies) before they reach sanitization/the database, not because
// the DB itself requires one.

export const markdownContentSchema = z
  .string()
  .min(1, "Content is required")
  .max(200_000, "Content is too long (max 200,000 characters)");

// `z.infer<typeof schema>` derives a TypeScript type straight from a Zod schema, so the type and the runtime validation can never drift apart.

export type IdParam = z.infer<typeof idParamSchema>;
export type ArticleIdParam = z.infer<typeof articleIdParamSchema>;
export type TechReadIdParam = z.infer<typeof techReadIdParamSchema>;
export type SubmissionIdParam = z.infer<typeof submissionIdParamSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type SortOrder = z.infer<typeof sortOrderSchema>;
export type ContentStatusInput = z.infer<typeof contentStatusSchema>;
