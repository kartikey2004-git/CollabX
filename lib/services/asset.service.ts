import { randomUUID } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import type { Asset, Role } from "../db";
import { uploadObject } from "../object-storage";
import { assetRepository } from "../repositories/asset.repository";
import { submissionRepository } from "../repositories/submission.repository";
import { ForbiddenError, NotFoundError, UnsupportedMediaTypeError, ValidationError } from "../errors";

// Same MIME allowlist as the OLD product's imageService/upload.middleware.ts — carried over
// unchanged, since the constraint (only embeddable image types) hasn't changed with the pivot.
const ALLOWED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const assetService = {
  /*

  Uploads an image for inline use in a Submission's Markdown content, and — unlike the OLD
  product's imageService, which only ever returned a bare URL — persists an Asset row scoped to
  that specific Submission (see schema.prisma's comment on Asset: an asset belongs to one specific
  reviewable version, not to the Article/TechRead as a whole).

  Authorization (a judgment call — see 004-backend-changes.md): only the submission's own owner
  (submittedBy) or an ADMIN may upload to it, and ONLY while the submission is still DRAFT.
  Uploading to a PENDING_REVIEW/PUBLISHED/REJECTED submission doesn't fit the workflow — a
  submission that's already been sent for review shouldn't silently grow new embedded images an
  admin never saw during moderation, and a PUBLISHED/REJECTED submission is a closed, immutable
  historical record (the versioning/submission model this schema is built around, per
  schema.prisma's own comment on Submission — "a rejected submission's content is never mutated").

  */
  async upload(
    submissionId: string,
    requester: { id: string; role: Role },
    file: { buffer: Buffer; mimetype: string; size: number },
  ): Promise<Asset> {
    const submission = await submissionRepository.findById(submissionId);
    if (!submission) {
      throw new NotFoundError("Submission not found");
    }

    if (submission.submittedBy !== requester.id && requester.role !== "ADMIN") {
      throw new ForbiddenError("Only the submission's owner or an admin may upload assets to it");
    }

    if (submission.status !== "DRAFT") {
      throw new ForbiddenError("Assets can only be uploaded to a draft submission");
    }

    if (!file.buffer || file.size === 0) {
      throw new ValidationError("Request validation failed", [
        { path: "body.image", message: "No file was uploaded" },
      ]);
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new UnsupportedMediaTypeError(
        `Unsupported image type "${file.mimetype}". Allowed types: ${Array.from(ALLOWED_MIME_TYPES).join(", ")}`,
      );
    }

    // Magic-byte check: `file.mimetype` above is just the client-declared Content-Type header,
    // trivially spoofable (e.g. a renamed .html file uploaded as "image/png"). Sniff the actual
    // file bytes and require BOTH that the detected type is itself on the allowlist AND that it
    // matches the declared type exactly — closing the gap documented in
    // docs/changes/006-security-and-rbac.md §10. Checking only "detected is somewhere on the
    // allowlist" (without cross-checking against `file.mimetype`) would still let a real PNG
    // sneak through mislabeled as "image/gif": both are individually allowed, but declaring one
    // type while shipping another is exactly the kind of mismatch a magic-byte check exists to
    // catch, not just "is this any kind of image."
    const detected = await fileTypeFromBuffer(file.buffer);
    if (!detected || !ALLOWED_MIME_TYPES.has(detected.mime) || detected.mime !== file.mimetype) {
      throw new UnsupportedMediaTypeError(
        `The uploaded file's content does not match its declared type ("${file.mimetype}")`,
      );
    }

    const extension = EXTENSION_BY_MIME_TYPE[file.mimetype];
    const storageKey = `submissions/${submissionId}/${randomUUID()}.${extension}`;

    const url = await uploadObject({
      key: storageKey,
      body: file.buffer,
      contentType: file.mimetype,
    });

    return assetRepository.create({
      url,
      storageKey,
      mimeType: file.mimetype,
      size: file.size,
      uploadedBy: requester.id,
      submissionId,
    });
  },
};
