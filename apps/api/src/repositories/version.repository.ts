import db from "@repo/database";
import type { Prisma, Version } from "@repo/database";

// Either the normal database client, or a transaction client (used when several database calls need to succeed or fail together).

type Db = typeof db | Prisma.TransactionClient;

// Note: snapshot history is immutable and behind each artifact's content.

export const versionRepository = {
  // Insert a new version snapshot row for an artifact.
  create(
    data: {
      artifactId: string;
      version: number;
      contentSnapshot: Prisma.InputJsonValue;
      createdBy: string;
      label?: string;
    },
    client: Db = db,
  ): Promise<Version> {
    return client.version.create({ data });
  },

  // All versions of this artifact, ordered newest to oldest, matching the [artifactId, version DESC] index.
  findByArtifact(artifactId: string): Promise<Version[]> {
    return db.version.findMany({
      where: { artifactId },
      orderBy: { version: "desc" },
    });
  },

  // The current highest/latest version number of the artifact, or null if no versions have been created.
  async findLatestVersionNumber(artifactId: string, client: Db = db): Promise<number | null> {
    const latest = await client.version.findFirst({
      where: { artifactId },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    return latest?.version ?? null;
  },

  // The latest version record for this artifact, or null if none exists. Used to determine, whether a new autosave snapshot should be created.
  findLatest(artifactId: string, client: Db = db): Promise<Version | null> {
    return client.version.findFirst({
      where: { artifactId },
      orderBy: { version: "desc" },
    });
  },

  // Finds a specific version by ID, scoped to its artifact to prevent restoring a version that belongs to a different artifact.
  findById(artifactId: string, versionId: string): Promise<Version | null> {
    return db.version.findFirst({
      where: { id: versionId, artifactId },
    });
  },
};
