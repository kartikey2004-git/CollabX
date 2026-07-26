import db from "@repo/database";
import type { Artifact, Prisma } from "@repo/database";
import {
  artifactContentSchemaByType,
  type CreateArtifactInput,
  type ListArtifactsQuery,
  type UpdateArtifactInput,
} from "@repo/validation";
import { artifactRepository } from "../repositories/artifact.repository";
import { recordVersion, recordVersionIfDue } from "./version.service";
import { markdownService } from "./markdown.service";
import { NotFoundError, ValidationError } from "../lib/errors";

export const artifactService = {
  // Creates a new artifact and its initial version (v1) in a single transaction.
  async create(projectId: string, userId: string, input: CreateArtifactInput): Promise<Artifact> {
    // If parentArtifactId is present, validate that the parent artifact exists and belongs to the same project.
    if (input.parentArtifactId) {
      await validateParent(projectId, input.parentArtifactId);
    }

    // Create the artifact and its initial version (v1) in a single transaction.
    return db.$transaction(async (tx) => {
      // Sanitizes the content based on the artifact type (omly MARKDOWN and DB_SCHEMA) by removing unsafe or malicious content and ensuring it matches the expected format.

      const content = markdownService.sanitizeContent(
        input.type,
        input.content as Prisma.InputJsonValue,
      );

      // Creates the artifact
      const artifact = await artifactRepository.create(
        {
          title: input.title,
          type: input.type,
          content,
          projectId,
          parentArtifactId: input.parentArtifactId,
          createdBy: userId,
        },
        tx,
      );

      // Creates the initial version (v1) for the artifact.
      await recordVersion(tx, artifact.id, content, userId, "Initial version");
      return artifact;
    });
  },

  /*
  
    - Updates an artifact's title, content, or parent. If the content is being updated, it's validated against the artifact's actual type since the update payload doesn't include a `type` field.

    - A new version snapshot is created only when the content has changed and a snapshot is due/throttled (`recordVersionIfDue` meaning, it will not create a new version if the last version was created within the last 10 minutes).

    - The artifact's current content is still saved on every update, so no edits are lost, only the version history is throttled.

    - Only content changes create a new version. Title and parent updates are excluded because version snapshots store content only.
  
  */

  async update(artifactId: string, userId: string, input: UpdateArtifactInput): Promise<Artifact> {
    // Fetches the artifact by id
    const artifact = await artifactRepository.findById(artifactId);

    if (!artifact) {
      throw new NotFoundError("Artifact not found");
    }

    if (input.content !== undefined) {
      // AI_NOTE is reserved for system-generated artifacts. It isn't user-creatable yet and has no user-facing content schema, but the type already exists in the database for future use.

      // Get the content schema for this artifact type so its content can be validated and sanitized correctly.

      const contentSchema =
        artifactContentSchemaByType[artifact.type as keyof typeof artifactContentSchemaByType];

      if (!contentSchema) {
        throw new ValidationError("Request validation failed", [
          {
            path: "body.content",
            message: `Content updates are not supported for artifact type ${artifact.type}`,
          },
        ]);
      }

      // Validate the content against the schema for this artifact type.
      const result = contentSchema.safeParse(input.content);

      if (!result.success) {
        throw new ValidationError(
          "Request validation failed",
          result.error.issues.map((issue) => ({
            path: ["body", "content", ...issue.path.map(String)].join("."),
            message: issue.message,
          })),
        );
      }
    }

    // If a new parent is being set, validate that the parent exists and belongs to the same project.
    if (input.parentArtifactId) {
      await validateParent(artifact.projectId, input.parentArtifactId, artifactId);
    }

    // Update the artifact. If the content has changed, create a new version snapshot when one is due.

    return db.$transaction(async (tx) => {
      // If content is being updated, sanitize it before saving.
      const content =
        input.content !== undefined
          ? markdownService.sanitizeContent(artifact.type, input.content as Prisma.InputJsonValue)
          : undefined;

      // Update the artifact.
      const updated = await artifactRepository.update(
        artifactId,
        {
          title: input.title,
          content,
          parentArtifactId: input.parentArtifactId,
          updatedBy: userId,
        },
        tx,
      );

      // If the content has changed, create a new version snapshot when one is due.
      if (content !== undefined) {
        await recordVersionIfDue(tx, artifactId, content, userId);
      }

      return updated;
    });
  },

  // Soft-delete the artifact, then cascade the same soft-delete to all of its descendants within a single transaction.

  async delete(artifactId: string): Promise<Artifact> {
    // Fetches all descendant ids for the given artifact id.
    const descendantIds = await artifactRepository.findDescendantIds(artifactId);

    return db.$transaction(async (tx) => {
      // Soft-deletes the artifact.
      const artifact = await artifactRepository.softDelete(artifactId, tx);

      // Soft-deletes all the descendants.
      await artifactRepository.softDeleteMany(descendantIds, tx);
      return artifact; // Returns the soft-deleted artifact.
    });
  },

  // Fetch one artifact by id, throwing a 404-style error if it doesn't exist.
  async getById(artifactId: string): Promise<Artifact> {
    const artifact = await artifactRepository.findById(artifactId);
    if (!artifact) {
      throw new NotFoundError("Artifact not found");
    }
    return artifact;
  },

  // Get the artifact's parent, or null if it's a root artifact. A missing parent is expected for root artifacts and isn't treated as an error.

  getParent(artifactId: string): Promise<Artifact | null> {
    return artifactRepository.findParent(artifactId);
  },

  // Get the artifact's direct children, unpaginated (these lists are naturally small).
  getChildren(artifactId: string): Promise<Artifact[]> {
    return artifactRepository.findChildren(artifactId);
  },

  // Get a page of artifacts that belong to a project.
  list(projectId: string, query: ListArtifactsQuery) {
    return artifactRepository.findByProject({
      projectId,
      cursor: query.cursor,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      type: query.type,
    });
  },
};

/*

  - Validates the `parentArtifactId` during create and update operations. 
  
  - The parent must exist and belong to the same project as the artifact. 
  
  - When re-parenting an existing artifact, it also prevents circular hierarchies by ensuring the artifact isn't assigned to itself or to one of its own descendants.

*/

async function validateParent(
  projectId: string,
  parentArtifactId: string,
  excludeArtifactId?: string,
): Promise<void> {
  // Fetches the parent artifact.
  const parent = await artifactRepository.findById(parentArtifactId);

  // Throws an error if the parent artifact is not found.
  if (!parent) {
    throw new ValidationError("Request validation failed", [
      { path: "body.parentArtifactId", message: "Parent artifact not found" },
    ]);
  }

  // Throws an error if the parent artifact does not belong to the same project.
  if (parent.projectId !== projectId) {
    throw new ValidationError("Request validation failed", [
      {
        path: "body.parentArtifactId",
        message: "Parent artifact must belong to the same project",
      },
    ]);
  }

  // If no artifact is being re-parented, no further validation is needed.
  if (!excludeArtifactId) return;

  // Throws an error if the artifact is being re-parented to itself.
  if (parentArtifactId === excludeArtifactId) {
    throw new ValidationError("Request validation failed", [
      { path: "body.parentArtifactId", message: "An artifact cannot be its own parent" },
    ]);
  }

  // Fetches the ancestor ids of the parent artifact.
  const ancestorIds = await artifactRepository.findAncestorChainIds(parentArtifactId);

  // Throws an error if the parent artifact is one of the artifact's ancestors.
  if (ancestorIds.includes(excludeArtifactId)) {
    throw new ValidationError("Request validation failed", [
      {
        path: "body.parentArtifactId",
        message: "This move would create a cycle in the artifact tree",
      },
    ]);
  }
}
