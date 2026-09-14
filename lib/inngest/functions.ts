import { createHash, randomUUID } from "node:crypto";
import { inngest } from "./client";
import db from "../db";
import { chunkMarkdown } from "../chunking";
import { EMBEDDING_MODEL, getEmbedding } from "../embeddings";
import type { IndexingEventData } from "./events";

// Replaces the old BullMQ `indexingWorker` (worker/index.ts + workers/indexing.worker.ts). Runs
// inside this same Next.js app via app/api/inngest/route.ts — Inngest calls back into that one
// route to execute this function, so there's no separate long-running worker process to deploy
// anymore.
//
// Each `step.run` is individually retried and memoized by Inngest: if the function crashes or
// times out partway through a long submission (many chunks, each requiring an embedding API call),
// a retry resumes from the first *incomplete* step instead of re-embedding chunks that already
// succeeded — a genuine improvement over BullMQ's whole-job retry, not just a like-for-like port.
export const indexSubmission = inngest.createFunction(
  { id: "index-submission", retries: 3, triggers: { event: "submission/indexing.requested" } },
  async ({ event, step }) => {
    const { submissionId } = event.data as IndexingEventData;

    const content = await step.run("fetch-submission-content", async () => {
      const submission = await db.submission.findUnique({
        where: { id: submissionId },
        select: { content: true },
      });
      return submission?.content ?? null;
    });

    if (content === null) {
      return { skipped: true, reason: "submission no longer exists" };
    }

    await step.run("mark-indexing", async () => {
      await db.submission.update({ where: { id: submissionId }, data: { indexStatus: "INDEXING" } });
    });

    try {
      const chunks = chunkMarkdown(content);

      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex += 1) {
        const chunk = chunks[chunkIndex]!;

        await step.run(`index-chunk-${chunkIndex}`, async () => {
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
        });
      }

      await step.run("mark-indexed", async () => {
        await db.submission.update({
          where: { id: submissionId },
          data: { indexStatus: "INDEXED", lastIndexedAt: new Date() },
        });
      });

      return { submissionId, chunksIndexed: chunks.length };
    } catch (err) {
      await step.run("mark-failed", async () => {
        await db.submission.update({ where: { id: submissionId }, data: { indexStatus: "NOT_INDEXED" } });
      });
      throw err; // let Inngest record the failure and exhaust its own retry policy
    }
  },
);
