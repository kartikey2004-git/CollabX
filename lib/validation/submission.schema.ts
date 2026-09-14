import { z } from "zod";
import { contentStatusSchema, markdownContentSchema, paginationQuerySchema, summarySchema, titleSchema } from "./common.schema";

// Creates a new Submission (the next version) against an existing Article/TechRead the caller
// already owns (or is an ADMIN for). Used both for the very first submission created alongside a
// new Article/TechRead (see article.service.ts / tech-read.service.ts) and for follow-up versions
// created via POST /articles/:articleId/submissions or /tech-reads/:techReadId/submissions.

export const createSubmissionSchema = z.object({
  title: titleSchema,
  summary: summarySchema,
  content: markdownContentSchema,
});

// PATCH /submissions/:id — in-place edit of a DRAFT or PENDING_REVIEW submission (never a
// PUBLISHED/REJECTED one — see submission.service.ts's `update` for why). Unlike
// createSubmissionSchema, every field is optional (a caller may only want to fix the title), but at
// least one must be present — an empty PATCH body is almost certainly a client bug, not a
// legitimate no-op request.

export const updateSubmissionSchema = z
  .object({
    title: titleSchema.optional(),
    summary: summarySchema,
    content: markdownContentSchema.optional(),
  })
  .refine((data) => data.title !== undefined || data.summary !== undefined || data.content !== undefined, {
    message: "Provide at least one of title, summary, or content to update",
  });

/*

Admin review action — modeled as a discriminated union on `action` so a REJECT without a
`rejectionReason` is a 400 VALIDATION_ERROR (caught by the `validate` middleware, before the
service even runs), not a business-logic error the service has to reject itself. PUBLISH takes no
extra fields — the transaction that publishes a submission derives everything else (reviewedBy,
reviewedAt, the parent's denormalized title/summary) from the submission and the authenticated
admin, never from client input.

*/

export const reviewSubmissionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("PUBLISH") }),
  z.object({
    action: z.literal("REJECT"),
    rejectionReason: z
      .string()
      .trim()
      .min(1, "A rejection reason is required")
      .max(1000, "Rejection reason must be at most 1000 characters"),
  }),
]);

// GET /submissions (the admin moderation queue) — defaults to PENDING_REVIEW, matching
// schema.prisma's own `@@index([status, submittedAt])` comment describing exactly this query.
// Always sorted submittedAt descending (newest first) by the service — not client-controllable,
// since the whole point of a moderation queue is a stable ordering everyone sees the same way.

export const submissionQueueQuerySchema = paginationQuerySchema.extend({
  status: contentStatusSchema.default("PENDING_REVIEW"),
});

// GET /articles/:articleId/submissions or /tech-reads/:techReadId/submissions — the full version
// history for one piece of content (all statuses, including DRAFT/REJECTED), visible only to the
// content's owner or an ADMIN (enforced in the service, not by this schema). Newest version first
// by default.

export const submissionHistoryQuerySchema = paginationQuerySchema.extend({
  sortBy: z.enum(["version", "createdAt"]).default("version"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// The four states of the AI indexing pipeline (schema.prisma's `IndexStatus` enum).

export const indexStatusSchema = z.enum(["NOT_INDEXED", "INDEXING", "INDEXED", "STALE"]);

// GET /submissions/indexing — ADMIN-only "Indexing" dashboard: every PUBLISHED submission (any
// submission that isn't PUBLISHED was never enqueued for indexing in the first place — see
// submission.service.ts's PUBLISH branch), optionally narrowed to one indexStatus (e.g. "show me
// everything still NOT_INDEXED" to find what failed to enqueue). Sorted the same
// newest-submittedAt-first way as the moderation queue, reusing the same
// `@@index([status, submittedAt])` — no new index needed.

export const listIndexableQuerySchema = paginationQuerySchema.extend({
  indexStatus: indexStatusSchema.optional(),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type UpdateSubmissionInput = z.infer<typeof updateSubmissionSchema>;
export type ReviewSubmissionInput = z.infer<typeof reviewSubmissionSchema>;
export type SubmissionQueueQuery = z.infer<typeof submissionQueueQuerySchema>;
export type SubmissionHistoryQuery = z.infer<typeof submissionHistoryQuerySchema>;
export type IndexStatusInput = z.infer<typeof indexStatusSchema>;
export type ListIndexableQuery = z.infer<typeof listIndexableQuerySchema>;
