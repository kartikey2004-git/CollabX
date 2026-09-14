import { inngest } from "./client";
import logger from "../logger";

export interface IndexingEventData {
  submissionId: string;
}

// Enqueues indexing for one just-published Submission (consumed by lib/inngest/functions.ts's
// indexSubmission). Called from submission.service.ts AFTER the publish transaction commits (never
// from inside it — see the call site's comment for why). Send failures are logged, not thrown: an
// Inngest hiccup here must never turn a successful publish into a failed API response, since the
// content is already correctly published either way — it just means that submission won't be
// searchable until the next manual/future re-index.
export async function enqueueIndexing(submissionId: string): Promise<void> {
  try {
    await inngest.send({
      name: "submission/indexing.requested",
      data: { submissionId } satisfies IndexingEventData,
    });
  } catch (err) {
    logger.error({ err, submissionId }, "Failed to send indexing event");
  }
}
