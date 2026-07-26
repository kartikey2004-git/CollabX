import multer from "multer";
import { UnsupportedMediaTypeError } from "../lib/errors";

/*

  - Buffer uploaded files in memory (not disk) for the lifetime of the request. The file is immediately handed off to the upload service, which uploads it and it's immediately streamed to object storage, so it never needs to be written to the API server's local filesystem.

  - Validate the file's MIME type as early as possible to reject unsupported uploads before allocating memory for them. 
  The upload service repeats the same validation to enforce the rule at the storage boundary, providing a final layer of protection.

*/

const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export const imageUpload = multer({
  storage: multer.memoryStorage(), // returns a storage engine implementation configured to store files in memory as Buffer objects.

  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for the uploaded file.

  // Filter out the files that are not allowed.
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new UnsupportedMediaTypeError(`Unsupported image type "${file.mimetype}"`));
      return;
    }
    cb(null, true);
  },
}).single("image"); // upload a single file.
