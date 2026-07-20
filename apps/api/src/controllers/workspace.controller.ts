import { NextFunction, Request, Response } from "express";
import type {
  CreateWorkspaceInput,
  ListWorkspacesQuery,
  UpdateWorkspaceInput,
} from "@repo/validation";
import { workspaceService } from "../services/workspace.service";
import { sendSuccess } from "../lib/response";

// workspaceController object groups together all the functions (handlers) that respond to workspace-related HTTP requests, like creating, listing, updating, deleting

export const workspaceController = {

  // Handles "create a new workspace" requests (usually a POST request)
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {

      // Grab the data the user sent in the request body (name)
      const input = req.body as CreateWorkspaceInput;

      // Ask the service layer to actually create the workspace in the database, linking it to the currently logged-in user (req.user!.id)
      const workspace = await workspaceService.create(req.user!.id, input);

      // Send back the newly created workspace with a 201 "Created" status
      sendSuccess(res, workspace, { status: 201 });
    } catch (err) {
      // If anything goes wrong, pass the error to Express's error handler.
      next(err);
    }
  },

  // Handles "get a list of workspaces" requests (usually a GET request)
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {

      // Grab query params like page size or cursor which is used for pagination
      const query = req.query as unknown as ListWorkspacesQuery;

      // Ask the service layer for the getting workspaces belonging to this user, along with pagination info (nextCursor, hasMore)
      const { items, nextCursor, hasMore } = await workspaceService.list(
        req.user!.id,
        query,
      );

      // Send back the list of workspaces plus pagination details
      sendSuccess(res, items, { meta: { nextCursor, hasMore } });
    } catch (err) {
      next(err);
    }
  },

  // Handles "update an existing workspace" requests (usually a PATCH/PUT request)
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get the workspace's id from the URL (e.g. /workspaces/:id)
      const { id } = req.params as { id: string };

      // Get the new data to update the workspace with, from the request body
      const input = req.body as UpdateWorkspaceInput;

      // Ask the service layer to update the workspace in the database
      const workspace = await workspaceService.update(id, input);

      // Send back the updated workspace
      sendSuccess(res, workspace);
    } catch (err) {
      next(err);
    }
  },

  // Handles "delete a workspace" requests (usually a DELETE request).
  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get the workspace's id from the URL params.
      const { id } = req.params as { id: string };

      // Ask the service layer to delete the workspace from the database.
      const workspace = await workspaceService.delete(id);
      sendSuccess(res, workspace);
    } catch (err) {
      next(err);
    }
  },
};
