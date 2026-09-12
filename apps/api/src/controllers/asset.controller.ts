import { NextFunction, Request, Response } from "express";
import type { SubmissionIdParam } from "@repo/validation";
import type { Role } from "@repo/database";
import { assetService } from "../services/asset.service";
import { sendSuccess } from "../lib/response";
import { ValidationError } from "../lib/errors";

export const assetController = {
  // Handles POST /submissions/:submissionId/assets. The uploaded file is available as `req.file`,
  // populated by the `imageUpload` (multer) middleware configured for this route in
  // asset.routes.ts.
  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { submissionId } = req.params as unknown as SubmissionIdParam;

      if (!req.file) {
        throw new ValidationError("Request validation failed", [
          { path: "body.image", message: "No file was uploaded" },
        ]);
      }

      const requester = { id: req.user!.id, role: req.user!.role as Role };
      const asset = await assetService.upload(submissionId, requester, req.file);
      sendSuccess(res, asset, { status: 201 });
    } catch (err) {
      next(err);
    }
  },
};
