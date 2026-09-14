import { z } from "zod";
import { paginationQuerySchema } from "./common.schema";

// Body length cap (1-2000 chars) matches the OLD MVP doc's own convention for a comment field,
// carried over unchanged since nothing about the pivot changes what a reasonable comment length is.

export const createCommentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment must be at most 2000 characters"),
  parentCommentId: z.cuid("Invalid parent comment id").optional(),
});

// GET .../comments — always newest-first (matches the schema's own
// `@@index([articleId, createdAt(sort: Desc)])` / `@@index([techReadId, createdAt(sort: Desc)])`),
// so sort field/order aren't exposed as request options at all; only cursor pagination is.

export const listCommentsQuerySchema = paginationQuerySchema;

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ListCommentsQuery = z.infer<typeof listCommentsQuerySchema>;
