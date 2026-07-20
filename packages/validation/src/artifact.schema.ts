import { z } from "zod";
import { paginationQuerySchema, sortOrderSchema } from "./common.schema";

// Only user-creatable artifact types are included here. AI_NOTE is reserved for system-generated artifacts.

export const artifactTypeSchema = z.enum(["MARKDOWN", "EXCALIDRAW", "DB_SCHEMA"]);

// Shared rule for an artifact's title, reused by both create and update below.
export const artifactTitleSchema = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(255, "Title must be at most 255 characters");

export const createArtifactSchema = z.object({
  title: artifactTitleSchema,
  type: artifactTypeSchema,

  // The artifact's actual content (markdown text, diagram data, schema JSON, etc.) shape varies by type, so it's left unvalidated here and defaults to empty.

  content: z.unknown().default({}),

  // Optional link to a parent artifact, for artifacts that are versions/children of another.

  parentArtifactId: z.cuid("Invalid parent artifact id").optional(),
});

// For updates, both fields are optional individually but `.refine()` rejects a request that sends neither, since that would be a pointless "update nothing" call.

export const updateArtifactSchema = z
  .object({
    title: artifactTitleSchema.optional(),
    content: z.unknown().optional(),
  })
  .refine((data) => data.title !== undefined || data.content !== undefined, {
    message: "At least one field must be provided",
  });

// Query params accepted by "list artifacts" — extends the shared pagination shape with sorting + an optional filter by artifact type.

export const listArtifactsQuerySchema = paginationQuerySchema.extend({
  sortBy: z.enum(["createdAt", "updatedAt", "title"]).default("createdAt"),
  sortOrder: sortOrderSchema,
  type: artifactTypeSchema.optional(),
});

// TypeScript types derived from each schema, so both the API and the frontend can share one source of truth for what these inputs look like.

export type ArtifactTypeInput = z.infer<typeof artifactTypeSchema>;
export type CreateArtifactInput = z.infer<typeof createArtifactSchema>;
export type UpdateArtifactInput = z.infer<typeof updateArtifactSchema>;
export type ListArtifactsQuery = z.infer<typeof listArtifactsQuerySchema>;