import { NextFunction, Request, Response } from "express";
import type {
  CreateArtifactInput,
  ListArtifactsQuery,
  UpdateArtifactInput,
} from "@repo/validation";
import { artifactService } from "../services/artifact.service";
import { sendSuccess } from "../lib/response";

// artifactController groups together all the functions (handlers) that respond to artifact-related HTTP requests, like creating, listing, updating, deleting

export const artifactController = {

  // Handles "create a new artifact" requests (usually a POST request)
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get the parent project's id from the URL (e.g. /projects/:projectId/artifacts)
      const { projectId } = req.params as { projectId: string };

      // Grab the data the user sent in the request body (name, type, etc.)
      const input = req.body as CreateArtifactInput;

      // Ask the service layer to create the artifact inside this project, linking it to the currently logged-in user
      const artifact = await artifactService.create(projectId, req.user!.id, input);

      // Send back the newly created artifact with a 201 "Created" status
      sendSuccess(res, artifact, { status: 201 });
    } catch (err) {
      // If anything goes wrong, pass the error to Express's error handler
      next(err);
    }
  },

  // Handles "get a list of artifacts" requests (usually a GET request)
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get the parent project's id from the URL
      const { projectId } = req.params as { projectId: string };

      // Grab query params like llimit or cursor which is used for pagination
      const query = req.query as unknown as ListArtifactsQuery;

      // Ask the service layer for the artifacts belonging to this project, along with pagination info (nextCursor, hasMore)
      const { items, nextCursor, hasMore } = await artifactService.list(
        projectId,
        query,
      );

      // Send back the list of artifacts plus pagination details
      sendSuccess(res, items, { meta: { nextCursor, hasMore } });
    } catch (err) {
      next(err);
    }
  },

  // Handles "get a single artifact by id" requests (usually a GET request)
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get the artifact's id from the URL (e.g. /artifacts/:id)
      const { id } = req.params as { id: string };

      // Ask the service layer to fetch this one artifact from the database
      const artifact = await artifactService.getById(id);

      // Send back the artifact that was found
      sendSuccess(res, artifact);
    } catch (err) {
      next(err);
    }
  },

  // Handles "update an existing artifact" requests (usually a PATCH/PUT request)
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get the artifact's id from the URL
      const { id } = req.params as { id: string };

      // Get the new data to update the artifact with, from the request body
      const input = req.body as UpdateArtifactInput;

      // Ask the service layer to update the artifact, tied to the currently logged-in user
      const artifact = await artifactService.update(id, req.user!.id, input);

      // Send back the updated artifact
      sendSuccess(res, artifact);
    } catch (err) {
      next(err);
    }
  },

  // Handles "delete an artifact" requests (usually a DELETE request)
  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get the artifact's id from the URL params
      const { id } = req.params as { id: string };

      // Ask the service layer to delete the artifact from the database
      const artifact = await artifactService.delete(id);

      // Send back the deleted artifact's data
      sendSuccess(res, artifact);
    } catch (err) {
      next(err);
    }
  },
};
