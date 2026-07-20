import { z } from "zod";

// Shared, reusable pieces of validation used across workspace/project/artifact schemas, so URL params and pagination rules are only defined once.

// Validates that a route param (e.g. /workspaces/:id) is a real cuid, the id format Prisma generates — catches malformed URLs before hitting the database.

export const idParamSchema = z.object({
  id: z.cuid("Invalid id"),
});

export const workspaceIdParamSchema = z.object({
  workspaceId: z.cuid("Invalid workspace id"),
});

export const projectIdParamSchema = z.object({
  projectId: z.cuid("Invalid project id"),
});

// Shared shape for "list" endpoints: an opaque cursor for pagination, and a page size capped at 100 (defaults to 20 if not provided).

export const paginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Whether a list is sorted oldest/lowest-first ("asc") or newest/highest-first ("desc", the default).

export const sortOrderSchema = z.enum(["asc", "desc"]).default("desc");

// `z.infer<typeof schema>` derives a TypeScript type straight from a Zod schema, so the type and the runtime validation can never drift apart.

export type IdParam = z.infer<typeof idParamSchema>;
export type WorkspaceIdParam = z.infer<typeof workspaceIdParamSchema>;
export type ProjectIdParam = z.infer<typeof projectIdParamSchema>;
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type SortOrder = z.infer<typeof sortOrderSchema>;
