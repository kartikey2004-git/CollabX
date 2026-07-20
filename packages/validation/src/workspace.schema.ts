import { z } from "zod";
import { paginationQuerySchema, sortOrderSchema } from "./common.schema";

// Shared rule for a workspace's name — reused by both create and update below.

export const workspaceNameSchema = z
  .string()
  .trim()
  .min(3, "Workspace name must be at least 3 characters")
  .max(50, "Workspace name must be at most 50 characters");

export const createWorkspaceSchema = z.object({
  name: workspaceNameSchema,
});

export const updateWorkspaceSchema = z.object({
  name: workspaceNameSchema,
});

// Query params accepted by "list workspaces" — extends the shared pagination shape with which field to sort by (name/createdAt/updatedAt).

export const listWorkspacesQuerySchema = paginationQuerySchema.extend({
  sortBy: z.enum(["createdAt", "updatedAt", "name"]).default("createdAt"),
  sortOrder: sortOrderSchema,
});

// TypeScript types derived from each schema, so both the API and the frontend can share one source of truth for what these inputs look like.

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type ListWorkspacesQuery = z.infer<typeof listWorkspacesQuerySchema>;