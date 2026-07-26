import { NextFunction, Request, Response } from "express";
import type { ArtifactVersionParam } from "@repo/validation";
import { versionService } from "../services/version.service";
import { sendSuccess } from "../lib/response";

export const versionController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Handles list an artifact's versions requests (GET /artifacts/:id/versions)

    try {
      // Get the parent artifact's id from the URL
      const { id } = req.params as { id: string };

      // Ask the service layer to list all versions of this artifact
      const versions = await versionService.list(id);

      // Send back the list of versions
      sendSuccess(res, versions);
    } catch (err) {
      next(err);
    }
  },

  async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Handles "restore an old version" requests (POST /artifacts/:id/versions/:versionId/restore).

    try {
      // Get the artifact's id and version's id from the URL params
      const { id, versionId } = req.params as unknown as ArtifactVersionParam;

      // Ask the service layer to restore the artifact's version
      const artifact = await versionService.restore(id, versionId, req.user!.id);

      // Send back the restored artifact
      sendSuccess(res, artifact);
    } catch (err) {
      next(err);
    }
  },
};
