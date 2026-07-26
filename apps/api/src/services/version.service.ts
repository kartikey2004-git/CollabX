import db from "@repo/database";
import type { Artifact, Prisma, Version } from "@repo/database";
import { versionRepository } from "../repositories/version.repository";
import { artifactRepository } from "../repositories/artifact.repository";
import { NotFoundError } from "../lib/errors";

// Either the normal database client, or a transaction client (used when several database calls need to succeed or fail together).

type Db = typeof db | Prisma.TransactionClient;

/*

  - Creates the next version snapshot for an artifact within the caller's transaction. 
  
  - This shared helper is used when an artifact is created, restored, or when content changes require a new version.
  
  - It is also the single place responsible for determining the next version number, ensuring version numbers remain consistent.

*/

export async function recordVersion(
  client: Db,
  artifactId: string,
  content: Prisma.InputJsonValue,
  userId: string,
  label?: string,
): Promise<Version> {
  // Finds the latest version number for the given artifact.
  const latest = await versionRepository.findLatestVersionNumber(artifactId, client);

  // Creates a new version record with the next sequential version number.
  return versionRepository.create(
    {
      artifactId,
      version: (latest ?? 0) + 1,
      contentSnapshot: content,
      createdBy: userId,
      label,
    },
    client,
  );
}

/*

  - Creates a version snapshot only when it's meaningful to do so. A new snapshot is recorded only if enough time (10 minutes) has passed since the last version and the content has actually changed, preventing redundant autosave snapshots.

  - Used by `artifactService.update` to throttle autosave versioning. Operations that should always create a version, such as artifact creation and restore, call `recordVersion` directly instead.

*/

const AUTO_SNAPSHOT_MIN_INTERVAL_MS = 10 * 60 * 1000;

export async function recordVersionIfDue(
  client: Db,
  artifactId: string,
  content: Prisma.InputJsonValue,
  userId: string,
): Promise<Version | null> {
  // Finds the latest version record for the given artifact.
  const latest = await versionRepository.findLatest(artifactId, client);

  // If there is a latest version, check if the content has changed or if enough time has passed since the last version.
  if (latest) {
    const contentUnchanged = JSON.stringify(latest.contentSnapshot) === JSON.stringify(content);

    const dueForSnapshot = Date.now() - latest.createdAt.getTime() >= AUTO_SNAPSHOT_MIN_INTERVAL_MS;

    if (contentUnchanged || !dueForSnapshot) {
      return null;
    }
  }

  // Creates a new version record with the next sequential version number.
  return recordVersion(client, artifactId, content, userId, "Auto saved");
}

export const versionService = {
  // Every version of an artifact, newest first.
  list(artifactId: string): Promise<Version[]> {
    return versionRepository.findByArtifact(artifactId);
  },

  /*
  
   - Restores the content of a previous version without resetting the version history.

   - The restored content becomes the artifact's current state and is immediately saved as a new version, preserving the restore operation as part of the version history.

  */

  async restore(artifactId: string, versionId: string, userId: string): Promise<Artifact> {
    // Finds the version record to restore.
    const version = await versionRepository.findById(artifactId, versionId);

    if (!version) {
      throw new NotFoundError("Version not found");
    }

    // Updates the artifact with the restored content and records a new version.
    return db.$transaction(async (tx) => {
      // Gets the content from the version record.
      const content = version.contentSnapshot as Prisma.InputJsonValue;

      // Updates the artifact with the restored content.
      const artifact = await artifactRepository.update(
        artifactId,
        { content, updatedBy: userId },
        tx,
      );

      // Records the restore operation as a new version.
      await recordVersion(tx, artifactId, content, userId, `Restored from v${version.version}`);

      return artifact;
    });
  },
};
