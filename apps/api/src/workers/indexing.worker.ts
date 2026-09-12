import { createHash, randomUUID } from "node:crypto";
import { Worker } from "bullmq";
import db from "@repo/database";
import { redis } from "../lib/redis";
import { chunkMarkdown } from "../lib/chunking";
import { EMBEDDING_MODEL, getEmbedding } from "../lib/embeddings";
import logger from "../config/logger";
import type { IndexingJobData } from "../queues/indexing.queue";

/*

Processes one "index-submission" job: chunks the Submission's Markdown content, embeds each
chunk, and writes VectorEmbedding rows — the AI-powered search/indexing feature
docs/changes/008-final-summary.md flagged as schema-only-and-inert. Walks Submission.indexStatus
through its existing enum states (NOT_INDEXED -> INDEXING -> INDEXED, reverting to NOT_INDEXED on
failure so a retry is possible; STALE is intentionally left unwired — nothing in this feature
re-indexes an already-published, immutable Submission, so that transition has no trigger yet).

VectorEmbedding.embedding is `Unsupported("vector(768)")` in schema.prisma, which Prisma Client
cannot select or write via its normal model API at all (confirmed: the column is NOT NULL with no
DB-level default in the baseline migration), so every VectorEmbedding row here is written with a
single raw SQL INSERT rather than `db.vectorEmbedding.create()` — id is generated with Node's
built-in `crypto.randomUUID()` since Prisma's `@default(cuid())` is a client-side default that raw
SQL doesn't get for free (the column is just a PK string; format doesn't matter functionally). The
`ON CONFLICT ... DO NOTHING` makes this idempotent against the existing
`@@unique([submissionId, embeddingModel, contentHash])` constraint, matching that constraint's own
stated purpose (re-running against unchanged content shouldn't duplicate rows).

*/

async function processJob(data: IndexingJobData): Promise<void> {
  const { submissionId } = data;

  const submission = await db.submission.findUnique({ where: { id: submissionId } });
  if (!submission) {
    logger.warn({ submissionId }, "Indexing job skipped: submission no longer exists");
    return;
  }

  await db.submission.update({ where: { id: submissionId }, data: { indexStatus: "INDEXING" } });

  try {
    const chunks = chunkMarkdown(submission.content);

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
      const chunk = chunks[chunkIndex]!;
      const contentHash = createHash("sha256").update(chunk).digest("hex");
      const embedding = await getEmbedding(chunk);
      const vectorLiteral = `[${embedding.join(",")}]`;

      await db.$executeRaw`
        INSERT INTO "vector_embeddings"
          ("id", "submissionId", "chunkIndex", "embeddingModel", "contentHash", "tokenCount", "content", "embedding")
        VALUES
          (${randomUUID()}, ${submissionId}, ${chunkIndex}, ${EMBEDDING_MODEL}, ${contentHash}, ${null}, ${chunk}, ${vectorLiteral}::vector)
        ON CONFLICT ("submissionId", "embeddingModel", "contentHash") DO NOTHING
      `;
    }

    await db.submission.update({
      where: { id: submissionId },
      data: { indexStatus: "INDEXED", lastIndexedAt: new Date() },
    });
  } catch (err) {
    logger.error({ err, submissionId }, "Indexing job failed");
    await db.submission.update({ where: { id: submissionId }, data: { indexStatus: "NOT_INDEXED" } });
    throw err; // let BullMQ record/retry the failed job
  }
}

export const indexingWorker = new Worker<IndexingJobData>(
  "indexing",
  (job) => processJob(job.data),
  { connection: redis },
);

indexingWorker.on("completed", (job) => {
  logger.info({ submissionId: job.data.submissionId }, "Indexing job completed");
});

indexingWorker.on("failed", (job, err) => {
  logger.error({ submissionId: job?.data.submissionId, err }, "Indexing job failed");
});
