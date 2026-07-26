import { NextFunction, Request, Response } from "express";
import { imageService } from "../services/image.service";
import { sendSuccess } from "../lib/response";
import { ValidationError } from "../lib/errors";

export const imageController = {
  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    /*
    
    - Uploads an image for a Markdown artifact and returns a URL that can be embedded inline. This handler processes POST /artifacts/:id/upload-image requests.
    
    - The uploaded file is available as req.file, populated by the imageUpload. Multer middleware configured for this route in artifact.routes.ts.
    
    */

    try {
      // Get artifact ID from the request parameters.
      const { id } = req.params as { id: string };

      // Validate the uploaded file before processing.
      if (!req.file) {
        throw new ValidationError("Request validation failed", [
          { path: "body.image", message: "No file was uploaded" },
        ]);
      }

      // Call the image service to upload the image.
      const result = await imageService.upload(id, req.file);

      // Send the response.
      sendSuccess(res, result, { status: 201 });
    } catch (err) {
      next(err);
    }
  },
};
