import { randomUUID } from "node:crypto";
import { uploadObject } from "../lib/object-storage";
import { UnsupportedMediaTypeError, ValidationError } from "../lib/errors";

// Image MIME(Multipurpose Internet Mail Extensions) types that are allowed to be embedded in an artifact. Files with any other MIME type are rejected before they're uploaded to object storage.

const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

// Maps each allowed MIME type to its file extension.
const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

// Handles the logic for image uploads. It validates the uploaded file, stores it in object storage, and returns the URL that the Markdown editor embeds in the document.

export const imageService = {
  async upload(
    artifactId: string,
    file: { buffer: Buffer; mimetype: string; size: number },
  ): Promise<{ url: string }> {
    // Throws an error if no file was uploaded or if the file is empty.
    if (!file.buffer || file.size === 0) {
      throw new ValidationError("Request validation failed", [
        { path: "body.image", message: "No file was uploaded" },
      ]);
    }

    // Throws an error if the file type is not supported.
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new UnsupportedMediaTypeError(
        `Unsupported image type "${file.mimetype}". Allowed types: ${Array.from(ALLOWED_MIME_TYPES).join(", ")}`,
      );
    }

    // Generates a unique key for the image and uploads it to object storage.
    const extension = EXTENSION_BY_MIME_TYPE[file.mimetype];
    const key = `artifacts/${artifactId}/${randomUUID()}.${extension}`; // like artifacts/artifact-id/image-id.png

    // Uploads the image to object storage.
    const url = await uploadObject({
      key,
      body: file.buffer,
      contentType: file.mimetype,
    });

    // Returns the URL that the Markdown editor embeds in the document.
    return { url };
  },
};
