import db from "@repo/database";
import type { Asset } from "@repo/database";

// Unlike the OLD product's imageService (which only ever returned a bare URL and never persisted a
// row), Asset is now a real model — every upload must produce a corresponding database row so it
// can be attributed to a Submission and an uploader, and eventually cleaned up/audited.
export const assetRepository = {
  create(data: {
    url: string;
    storageKey: string;
    mimeType: string;
    size: number;
    uploadedBy: string;
    submissionId: string;
  }): Promise<Asset> {
    return db.asset.create({ data });
  },
};
