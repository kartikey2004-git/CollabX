import { z } from "zod";
import { paginationQuerySchema } from "./common.schema";

// The three platform-wide roles (schema.prisma's `Role` enum). Repeated as a literal list rather
// than imported from `@repo/database` — this validation package has no dependency on the
// generated Prisma client, matching every other schema file here (see contentStatusSchema in
// common.schema.ts for the same pattern with ContentStatus).

export const roleSchema = z.enum(["ADMIN", "CONTRIBUTOR", "READER"]);

// PATCH /users/:id/role — ADMIN-only. Unlike every other resource's `:id` param, this one is
// deliberately NOT the shared `idParamSchema` (`z.cuid()`) from common.schema.ts: Article,
// TechRead, Submission, Comment, and Asset rows are all created via `db.<model>.create()`, so
// Prisma's own `@default(cuid())` actually generates their ids — but `User` rows are created by
// better-auth's Prisma adapter during sign-up, which supplies its own id (confirmed live: a real
// user id looks like "BjM8SOCO1ABDkB8wSrCHeW7xzBg3qIjj", which `z.cuid()` correctly rejects as
// invalid). This just requires a non-empty string, matching what better-auth actually produces.

export const userIdParamSchema = z.object({
  id: z.string().min(1, "Invalid id"),
});

export const updateUserRoleSchema = z.object({
  role: roleSchema,
});

// GET /users — ADMIN-only "manage users" listing, optionally narrowed to one role (e.g. "show me
// every CONTRIBUTOR" before promoting/demoting). Newest-first, matching User's own
// `@@index([createdAt])`.

export const listUsersQuerySchema = paginationQuerySchema.extend({
  role: roleSchema.optional(),
});

export type RoleInput = z.infer<typeof roleSchema>;
export type UserIdParam = z.infer<typeof userIdParamSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
