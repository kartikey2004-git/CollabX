import { Queue } from "bullmq";
import { redis } from "../lib/redis";
import logger from "../config/logger";

export interface IndexingJobData {
  submissionId: string;
}

// The AI-search/indexing job queue. Consumed by workers/indexing.worker.ts (run as its own
// process — see src/worker.ts). Activates the previously-inert Submission.indexStatus /
// VectorEmbedding schema (see docs/changes/008-final-summary.md's "Future improvements").
export const indexingQueue = new Queue<IndexingJobData>("indexing", { connection: redis });

// Enqueues indexing for one just-published Submission. Called from submission.service.ts AFTER
// the publish transaction commits (never from inside it — see the call site's comment for why).
// Enqueue failures are logged, not thrown: a Redis hiccup here must never turn a successful
// publish into a failed API response, since the content is already correctly published either way
// — it just means that submission won't be searchable until the next manual/future re-index.
export async function enqueueIndexing(submissionId: string): Promise<void> {
  try {
    await indexingQueue.add("index-submission", { submissionId });
  } catch (err) {
    logger.error({ err, submissionId }, "Failed to enqueue indexing job");
  }
}
