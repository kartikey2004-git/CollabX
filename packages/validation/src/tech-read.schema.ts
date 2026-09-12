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

// `description` mirrors Article's `summary` field name-for-name in the schema comment ("curator's
// annotation/summary of the linked resource"), but the Prisma column is literally named
// `description` on TechRead — kept as its own export so the field name matches the DB column, even
// though the validation rule (trim, max 500 chars) is identical to `summarySchema`.

export const descriptionSchema = summarySchema;

export const sourceNameSchema = z
  .string()
  .trim()
  .max(100, "Source name must be at most 100 characters")
  .optional();

// externalUrl is required and must be a well-formed absolute URL — TechRead only curates external
// resources, it never hosts original write-ups (schema.prisma's own comment on this field).

export const externalUrlSchema = z
  .url("Must be a valid URL")
  .max(2048, "URL must be at most 2048 characters");

// Capped at 10 tags of up to 50 chars each — TechRead.tags is a free-form Postgres text array with
// no DB-level limit, so this cap exists purely to prevent an abusive/oversized payload, not because
// the schema requires it.

export const tagsSchema = z
  .array(z.string().trim().min(1).max(50, "Each tag must be at most 50 characters"))
  .max(10, "At most 10 tags are allowed")
  .optional();

// Creates a TechRead + its initial (v1) Submission together — see techReadService.create.
// `category` is optional here (unlike Article, where it's required), matching the schema's
// `category Category?` on TechRead. `content` is the curator's full write-up/annotation, stored on
// the initial Submission; `description` is the short blurb denormalized onto the TechRead row
// itself for fast listing (see schema.prisma's comment on TechRead.description).

export const createTechReadSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  externalUrl: externalUrlSchema,
  sourceName: sourceNameSchema,
  category: categorySchema.optional(),
  tags: tagsSchema,
  content: markdownContentSchema,
});

// Public listing (GET /tech-reads): PUBLISHED-only, enforced in the service (same reasoning as
// Article's listArticlesQuerySchema). `isTrending=true` narrows to the "Trending Tech Reads" feed;
// when set, the service sorts by trendingScore regardless of `sortBy` — see tech-read.service.ts.

export const listTechReadsQuerySchema = paginationQuerySchema.extend({
  category: categorySchema.optional(),
  isTrending: z.coerce.boolean().optional(),
  sortBy: z.enum(["publishedAt", "createdAt", "trendingScore", "title"]).default("publishedAt"),
  sortOrder: sortOrderSchema,
});

// "My tech reads" / admin moderation listing — same shape/reasoning as listArticlesAdminQuerySchema.

export const listTechReadsAdminQuerySchema = paginationQuerySchema.extend({
  status: contentStatusSchema.optional(),
  category: categorySchema.optional(),
  sortBy: z.enum(["createdAt", "updatedAt", "title"]).default("createdAt"),
  sortOrder: sortOrderSchema,
});

// ADMIN-only "toggle trending" action — deliberately restricted to ONLY these two fields (never
// title/status/currentSubmissionId), for the same reason Article has no direct update endpoint:
// letting this schema accept more would let an admin (or a bug) bypass the Submission-based
// moderation flow and edit published content in place.

export const updateTechReadTrendingSchema = z
  .object({
    isTrending: z.boolean().optional(),
    trendingScore: z.coerce
      .number()
      .int()
      .min(0, "trendingScore must be at least 0")
      .max(1_000_000, "trendingScore must be at most 1,000,000")
      .optional(),
  })
  .refine((data) => data.isTrending !== undefined || data.trendingScore !== undefined, {
    message: "At least one field must be provided",
  });

export type CreateTechReadInput = z.infer<typeof createTechReadSchema>;
export type ListTechReadsQuery = z.infer<typeof listTechReadsQuerySchema>;
export type ListTechReadsAdminQuery = z.infer<typeof listTechReadsAdminQuerySchema>;
export type UpdateTechReadTrendingInput = z.infer<typeof updateTechReadTrendingSchema>;
