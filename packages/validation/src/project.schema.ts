import { z } from "zod";
import { paginationQuerySchema, sortOrderSchema } from "./common.schema";

// Shared rules for a project's name and (optional) description, reused below.

export const projectNameSchema = z
  .string()
  .trim()
  .min(3, "Project name must be at least 3 characters")
  .max(100, "Project name must be at most 100 characters");

export const projectDescriptionSchema = z
  .string()
  .trim()
  .max(2000, "Description must be at most 2000 characters")
  .optional();

export const createProjectSchema = z.object({
  name: projectNameSchema,
  description: projectDescriptionSchema,
});

// For updates, both fields are optional individually (you might only rename, or only change the description) but `.refine()` rejects a request that sends neither, since that would be a pointless "update nothing" call.

export const updateProjectSchema = z
  .object({
    name: projectNameSchema.optional(),
    description: projectDescriptionSchema,
  })
  .refine((data) => data.name !== undefined || data.description !== undefined, {
    message: "At least one field must be provided",
  });

// Query params accepted by "list projects" — extends the shared pagination shape with which field to sort by.

export const listProjectsQuerySchema = paginationQuerySchema.extend({
  sortBy: z.enum(["createdAt", "updatedAt", "name"]).default("createdAt"),
  sortOrder: sortOrderSchema,
});

// TypeScript types derived from each schema, so both the API and the frontend can share one source of truth for what these inputs look like.

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;