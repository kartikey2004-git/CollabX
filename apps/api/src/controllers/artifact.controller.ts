import { NextFunction, Request, Response } from "express";
import type {
  CreateArtifactInput,
  ListArtifactsQuery,
  UpdateArtifactInput,
} from "@repo/validation";
import { artifactService } from "../services/artifact.service";
import { sendSuccess } from "../lib/response";

export const artifactController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get the parent project's id from the URL e.g /projects/:projectId/artifacts
      const { projectId } = req.params as { projectId: string };

      // Grab the data the user sent in the req.body like title, type of artifact, content, parentArtifactId
      const input = req.body as CreateArtifactInput;

      // Ask the service layer to create the artifact inside this project, linking it to the currently logged-in user
      const artifact = await artifactService.create(projectId, req.user!.id, input);

      // Send back the newly created artifact with a 201 "Created" status
      sendSuccess(res, artifact, { status: 201 });
    } catch (err) {
      next(err); // If anything goes wrong, pass the error to Express's error handler
    }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get the parent project's id from the URL
      const { projectId } = req.params as { projectId: string };

      // Grab query params like limit, cursor, sortBy, sortOrder, artifact type which is used for pagination
      const query = req.query as unknown as ListArtifactsQuery;

      // Ask the service layer for the artifacts belonging to this project, with pagination info (nextCursor, hasMore)
      const { items, nextCursor, hasMore } = await artifactService.list(projectId, query);

      // Send back the list of artifacts + pagination details
      sendSuccess(res, items, { meta: { nextCursor, hasMore } });
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get the artifact's id from the URL e.g /artifacts/:id
      const { id } = req.params as { id: string };

      // Ask the service layer to fetch this one artifact from the database
      const artifact = await artifactService.getById(id);

      // Send back the artifact that was found
      sendSuccess(res, artifact);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get the artifact's id from the URL
      const { id } = req.params as { id: string };

      // Get the new data like title, content, parentArtifactId to update the artifact with, from the request body
      const input = req.body as UpdateArtifactInput;

      // Ask the service layer to update the artifact, tied to the currently logged-in user
      const artifact = await artifactService.update(id, req.user!.id, input);

      // Send back the updated artifact
      sendSuccess(res, artifact);
    } catch (err) {
      next(err);
    }
  },

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

  async getParent(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Returns the parent of an artifact. But root artifacts have no parent, so the response is `data: null`

    try {
      // Get the artifact's id from the URL params
      const { id } = req.params as { id: string };

      // Ask the service layer for this artifact's parent (or null, if it's a root artifact)
      const parent = await artifactService.getParent(id);

      // Send back the parent that was found (or null)
      sendSuccess(res, parent);
    } catch (err) {
      next(err);
    }
  },

  async getChildren(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get the artifact's id from the URL params
      const { id } = req.params as { id: string };

      // Ask the service layer for this artifact's direct children
      const children = await artifactService.getChildren(id);

      // Send back the list of children
      sendSuccess(res, children);
    } catch (err) {
      next(err);
    }
  },
};
