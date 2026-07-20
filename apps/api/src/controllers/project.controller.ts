import { NextFunction, Request, Response } from "express";
import type {
  CreateProjectInput,
  ListProjectsQuery,
  UpdateProjectInput,
} from "@repo/validation";
import { projectService } from "../services/project.service";
import { sendSuccess } from "../lib/response";

// projectController object groups together all the functions (handlers) that respond to project-related HTTP requests, like creating, listing, updating, deleting

export const projectController = {

  // Handles "create a new project" requests (usually a POST request)
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get the parent workspace's id from the URL (e.g. /workspaces/:workspaceId/projects)
      const { workspaceId } = req.params as { workspaceId: string };

      // Grab the data the user sent in the request body (name, etc.)
      const input = req.body as CreateProjectInput;

      // Ask the service layer to create the project inside this workspace, linking it to the currently logged-in user
      const project = await projectService.create(workspaceId, req.user!.id, input);

      // Send back the newly created project with a 201 "Created" status
      sendSuccess(res, project, { status: 201 });
    } catch (err) {
      // If anything goes wrong, pass the error to Express's error handler
      next(err);
    }
  },

  // Handles "get a list of projects" requests (usually a GET request)
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get the parent workspace's id from the URL
      const { workspaceId } = req.params as { workspaceId: string };

      // Grab query params like limit or cursor which is used for pagination
      const query = req.query as unknown as ListProjectsQuery;

      // Ask the service layer for the projects belonging to this workspace, along with pagination info (nextCursor, hasMore)
      const { items, nextCursor, hasMore } = await projectService.list(
        workspaceId,
        query,
      );

      // Send back the list of projects plus pagination details
      sendSuccess(res, items, { meta: { nextCursor, hasMore } });
    } catch (err) {
      next(err);
    }
  },

  // Handles "update an existing project" requests (usually a PATCH/PUT request)
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get the project's id from the URL (e.g. /projects/:id)
      const { id } = req.params as { id: string };

      // Get the new data to update the project with, from the request body
      const input = req.body as UpdateProjectInput;

      // Ask the service layer to update the project, tied to the currently logged-in user
      const project = await projectService.update(id, req.user!.id, input);

      // Send back the updated project
      sendSuccess(res, project);
    } catch (err) {
      next(err);
    }
  },

  // Handles "delete a project" requests (usually a DELETE request)
  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get the project's id from the URL params
      const { id } = req.params as { id: string };

      // Ask the service layer to delete the project from the database
      const project = await projectService.delete(id);

      // Send back the deleted project's data
      sendSuccess(res, project);
    } catch (err) {
      next(err);
    }
  },
};
