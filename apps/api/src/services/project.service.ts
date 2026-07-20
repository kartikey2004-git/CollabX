import db from "@repo/database";
import type { Project } from "@repo/database";
import type {
  CreateProjectInput,
  ListProjectsQuery,
  UpdateProjectInput,
} from "@repo/validation";
import { projectRepository } from "../repositories/project.repository";
import { artifactRepository } from "../repositories/artifact.repository";

// Turns a project name into a URL-friendly slug, e.g. "My Cool Project!" -> "my-cool-project".
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// This is where the "business logic" for projects lives — it sits between the controller (handles HTTP) and the repository (talks to the database).

export const projectService = {
  
  // Create a new project inside a workspace, auto-generating its slug from the name.
  create(
    workspaceId: string,
    userId: string,
    input: CreateProjectInput,
  ): Promise<Project> {
    return projectRepository.create({
      name: input.name,
      description: input.description,
      slug: slugify(input.name),
      workspaceId,
      createdBy: userId,
    });
  },

  // Update a project's name/description.
  update(
    projectId: string,
    userId: string,
    input: UpdateProjectInput,
  ): Promise<Project> {
    return projectRepository.update(projectId, {
      name: input.name,
      description: input.description,
      updatedBy: userId,
    });
  },

  // Delete a project, along with all its artifacts.
  async delete(projectId: string): Promise<Project> {
    
    // Project has a `deletedAt` column specifically for trash/recovery — cascade is therefore a soft-delete of the project's artifacts too, done in one transaction so neither side is left orphaned.

    return db.$transaction(async (tx) => {
      const project = await projectRepository.softDelete(projectId, tx);
      await artifactRepository.softDeleteManyByProject(projectId, tx);
      return project;
    });
  },

  // Get a page of projects that belong to a workspace.
  list(workspaceId: string, query: ListProjectsQuery) {
    return projectRepository.findByWorkspace({
      workspaceId,
      cursor: query.cursor,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  },
};
