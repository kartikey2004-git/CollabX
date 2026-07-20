import type { Artifact, Prisma } from "@repo/database";
import type {
  CreateArtifactInput,
  ListArtifactsQuery,
  UpdateArtifactInput,
} from "@repo/validation";
import { artifactRepository } from "../repositories/artifact.repository";
import { NotFoundError } from "../lib/errors";

// This is where the "business logic" for artifacts lives — it sits between the controller (handles HTTP) and the repository (talks to the database).

export const artifactService = {
  
  // Create a new artifact inside a project.
  create(
    projectId: string,
    userId: string,
    input: CreateArtifactInput,
  ): Promise<Artifact> {
    return artifactRepository.create({
      title: input.title,
      type: input.type,
      content: input.content as Prisma.InputJsonValue,
      projectId,
      parentArtifactId: input.parentArtifactId,
      createdBy: userId,
    });
  },

  // Update an artifact's title/content.
  update(
    artifactId: string,
    userId: string,
    input: UpdateArtifactInput,
  ): Promise<Artifact> {
    return artifactRepository.update(artifactId, {
      title: input.title,
      content: input.content as Prisma.InputJsonValue | undefined,
      updatedBy: userId,
    });
  },

  // Soft-delete a single artifact.
  delete(artifactId: string): Promise<Artifact> {
    return artifactRepository.softDelete(artifactId);
  },

  // Fetch one artifact by id, throwing a 404-style error if it doesn't exist.
  async getById(artifactId: string): Promise<Artifact> {
    const artifact = await artifactRepository.findById(artifactId);
    if (!artifact) {
      throw new NotFoundError("Artifact not found");
    }
    return artifact;
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
