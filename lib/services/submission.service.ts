import db from "../db";
import type { Role, Submission } from "../db";
import { Prisma } from "../db";
import type {
  CreateSubmissionInput,
  ListIndexableQuery,
  ReviewSubmissionInput,
  SubmissionHistoryQuery,
  SubmissionQueueQuery,
  UpdateSubmissionInput,
} from "../validation";
import { submissionRepository, type ParentType } from "../repositories/submission.repository";
import { articleRepository } from "../repositories/article.repository";
import { techReadRepository } from "../repositories/tech-read.repository";
import { articleService } from "./article.service";
import { techReadService } from "./tech-read.service";
import { sanitizeMarkdownText } from "./markdown.service";
import { ConflictError, ForbiddenError, NotFoundError } from "../errors";
import { enqueueIndexing } from "../inngest/events";
import { invalidateCache } from "../cache";

function parentIdOf(submission: Submission): { parentType: ParentType; parentId: string } {
  if (submission.articleId) return { parentType: "article", parentId: submission.articleId };
  if (submission.techReadId) return { parentType: "techRead", parentId: submission.techReadId };
  // Unreachable given the DB's exactly-one-of CHECK constraint (see schema.prisma's comment on
  // Submission), but keeps this function total for TypeScript.
  throw new Error("Submission has neither articleId nor techReadId set");
}

export const submissionService = {
  /*

  Creates the next version (Submission) against an existing, already-created Article/TechRead.
  Concurrency rule (a judgment call — see 004-backend-changes.md): only one submission may be
  "in flight" (DRAFT or PENDING_REVIEW) per parent at a time. This prevents two overlapping drafts
  from racing each other to publish/review and keeps "which version is currently being worked on"
  unambiguous for both the contributor and the admin queue. A rejected or published submission
  doesn't count as in-flight, so resubmission after rejection is always allowed.

  `version` is computed as (max existing version) + 1 inside the same transaction as the insert —
  the real safety net against two concurrent requests racing past the `countActive` check above is
  the `@@unique([articleId, version])` / `@@unique([techReadId, version])` DB constraint; a P2002
  from that constraint is caught below and translated into a 409 instead of leaking a raw Prisma
  error or crashing the request.

  */
  async createNewVersion(
    parentType: ParentType,
    parentId: string,
    requester: { id: string; role: Role },
    input: CreateSubmissionInput,
  ): Promise<Submission> {
    if (parentType === "article") {
      await articleService.assertOwnerOrAdmin(parentId, requester);
    } else {
      await techReadService.assertOwnerOrAdmin(parentId, requester);
    }

    const activeCount = await submissionRepository.countActive(parentType, parentId);
    if (activeCount > 0) {
      throw new ConflictError(
        "A draft or pending-review submission already exists for this content — finish or wait for it to be reviewed before starting another",
      );
    }

    try {
      return await db.$transaction(async (tx) => {
        const latestVersion = await submissionRepository.findLatestVersionNumber(parentType, parentId, tx);
        const version = (latestVersion ?? 0) + 1;

        return submissionRepository.create(
          {
            parentType,
            parentId,
            version,
            title: input.title,
            summary: input.summary,
            content: sanitizeMarkdownText(input.content),
            submittedBy: requester.id,
          },
          tx,
        );
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictError(
          "Another submission was created for this content at the same time — please retry",
        );
      }
      throw err;
    }
  },

  // DRAFT -> PENDING_REVIEW. Only the submission's own author, or an ADMIN, may submit it.
  async submitForReview(submissionId: string, requester: { id: string; role: Role }): Promise<Submission> {
    const submission = await submissionRepository.findById(submissionId);
    if (!submission) {
      throw new NotFoundError("Submission not found");
    }

    if (submission.submittedBy !== requester.id && requester.role !== "ADMIN") {
      throw new ForbiddenError("Only the submission's author or an admin may submit it for review");
    }

    if (submission.status !== "DRAFT") {
      throw new ConflictError("Only a draft submission can be submitted for review");
    }

    return submissionRepository.markPendingReview(submissionId);
  },

  /*

  In-place edit of a submission's own title/summary/content — deliberately NOT a new version. This
  is for fixing a DRAFT before it's ever submitted, or an ADMIN tightening up a PENDING_REVIEW
  submission during review (a typo, a heading) without kicking it back to the contributor. Two
  callers, one rule each:

  - The submission's own author may edit it while it's still DRAFT or PENDING_REVIEW (not yet
    decided) — the same window createNewVersion's "one in-flight submission" rule already treats as
    "still being worked on."
  - An ADMIN may edit any DRAFT or PENDING_REVIEW submission (typically PENDING_REVIEW, since that's
    what the review screen shows), for the same reason.

  PUBLISHED and REJECTED are both permanently off-limits here: schema.prisma's comment on Submission
  is explicit that a rejected submission is never mutated in place (resubmission is always a new
  version), and mutating a PUBLISHED submission's content in place would silently change what's
  live without going through review again. Both throw ConflictError, matching `review`'s own
  status-guard pattern above.

  */
  async update(
    submissionId: string,
    requester: { id: string; role: Role },
    input: UpdateSubmissionInput,
  ): Promise<Submission> {
    const submission = await submissionRepository.findById(submissionId);
    if (!submission) {
      throw new NotFoundError("Submission not found");
    }

    const isOwner = submission.submittedBy === requester.id;
    if (!isOwner && requester.role !== "ADMIN") {
      throw new ForbiddenError("Only the submission's author or an admin may edit it");
    }

    if (submission.status !== "DRAFT" && submission.status !== "PENDING_REVIEW") {
      throw new ConflictError(
        "Only a draft or pending-review submission can be edited — published or rejected submissions are never mutated in place",
      );
    }

    return submissionRepository.update(submissionId, {
      title: input.title,
      summary: input.summary,
      content: input.content !== undefined ? sanitizeMarkdownText(input.content) : undefined,
    });
  },

  /*

  Publish or reject a PENDING_REVIEW submission. ADMIN-only (enforced by the route). This is the
  single most safety-critical piece of business logic in the feature — see schema.prisma's own
  extensive comment on the Submission model for why the publish path MUST run inside one
  `db.$transaction`.

  PUBLISH: updates the Submission (status, reviewedBy, reviewedAt) AND the parent Article/TechRead
  (status, currentSubmissionId, publishedAt, denormalized title/summary) together. Doing these as
  two separate statements risks exactly the inconsistency schema.prisma warns about: a "published"
  parent whose currentSubmissionId still points at the old version if the second write fails.

  REJECT: updates ONLY the Submission (status, reviewedBy, reviewedAt, rejectionReason) — the
  parent's status/currentSubmissionId/publishedAt are never touched. If the parent already has a
  different published version, rejecting this submission must not unpublish it; if this was the
  parent's very first submission, the parent simply stays in its default DRAFT/no-currentSubmission
  state. Wrapped in `db.$transaction` too, for consistency with the publish path and in case a
  future change adds a second write here — today it's a single UPDATE statement, which Postgres
  already makes atomic on its own.

  Both paths validate the submission is currently PENDING_REVIEW first — publishing/rejecting a
  DRAFT, already-PUBLISHED, or already-REJECTED submission is an invalid state transition
  (schema.prisma explicitly says this belongs in the application layer, not the DB) and throws
  ConflictError rather than silently succeeding.

  */
  async review(
    submissionId: string,
    adminId: string,
    input: ReviewSubmissionInput,
  ): Promise<Submission> {
    const submission = await submissionRepository.findById(submissionId);
    if (!submission) {
      throw new NotFoundError("Submission not found");
    }

    if (submission.status !== "PENDING_REVIEW") {
      throw new ConflictError("Only a pending-review submission can be published or rejected");
    }

    const { parentType, parentId } = parentIdOf(submission);

    if (input.action === "PUBLISH") {
      const updated = await db.$transaction(async (tx) => {
        const published = await submissionRepository.markPublished(submissionId, adminId, tx);

        if (parentType === "article") {
          await articleRepository.publishWithSubmission(
            parentId,
            { currentSubmissionId: submissionId, title: submission.title, summary: submission.summary },
            tx,
          );
        } else {
          await techReadRepository.publishWithSubmission(
            parentId,
            { currentSubmissionId: submissionId, title: submission.title, description: submission.summary },
            tx,
          );
        }

        return published;
      });

      // Both of these run AFTER the transaction has committed, never inside it — a Redis call
      // (either one) inside the transaction callback would hold the DB transaction open across a
      // network round-trip, and if it failed, roll back a publish that Redis had already been
      // told about. Neither is allowed to fail the request: see enqueueIndexing's and
      // invalidateCache's own comments for why each swallows its own errors.
      await enqueueIndexing(submissionId);
      await invalidateCache(parentType === "article" ? "articles:list:" : "tech-reads:list:");

      return updated;
    }

    // REJECT
    return db.$transaction(async (tx) =>
      submissionRepository.markRejected(submissionId, adminId, input.rejectionReason, tx),
    );
  },

  // Owner, ADMIN, or (if PUBLISHED) anyone may fetch a submission by id.
  async getById(submissionId: string, requester: { id: string; role: Role }): Promise<Submission> {
    const submission = await submissionRepository.findById(submissionId);
    if (!submission) {
      throw new NotFoundError("Submission not found");
    }

    const isOwnerOrAdmin = submission.submittedBy === requester.id || requester.role === "ADMIN";
    if (submission.status !== "PUBLISHED" && !isOwnerOrAdmin) {
      throw new ForbiddenError("You do not have permission to view this submission");
    }

    return submission;
  },

  // ADMIN-only moderation queue — default status=PENDING_REVIEW, newest submittedAt first.
  listQueue(query: SubmissionQueueQuery) {
    return submissionRepository.findQueue({
      status: query.status,
      cursor: query.cursor,
      limit: query.limit,
    });
  },

  // Full version history for one Article/TechRead — owner or ADMIN only.
  async listHistory(
    parentType: ParentType,
    parentId: string,
    requester: { id: string; role: Role },
    query: SubmissionHistoryQuery,
  ) {
    if (parentType === "article") {
      await articleService.assertOwnerOrAdmin(parentId, requester);
    } else {
      await techReadService.assertOwnerOrAdmin(parentId, requester);
    }

    return submissionRepository.findHistory({
      parentType,
      parentId,
      cursor: query.cursor,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  },

  // ADMIN-only "Indexing" dashboard listing — see submission.repository.ts::findIndexable.
  listIndexable(query: ListIndexableQuery) {
    return submissionRepository.findIndexable({
      indexStatus: query.indexStatus,
      cursor: query.cursor,
      limit: query.limit,
    });
  },

  // ADMIN-only manual re-enqueue (enforced by the route, not re-checked here — same convention as
  // techReadService.updateTrending). Only a PUBLISHED submission can be (re-)indexed: a
  // DRAFT/PENDING_REVIEW/REJECTED submission was never eligible for indexing in the first place
  // (see the PUBLISH branch of `review` above, the only place indexing is ever enqueued), so
  // re-indexing one would create VectorEmbedding rows for content nobody can actually read yet.
  // Useful when the initial enqueue failed (e.g. Redis was briefly down) or after a provider/model
  // change makes re-embedding worthwhile.
  async reindex(submissionId: string): Promise<Submission> {
    const submission = await submissionRepository.findById(submissionId);
    if (!submission) {
      throw new NotFoundError("Submission not found");
    }
    if (submission.status !== "PUBLISHED") {
      throw new ConflictError("Only a published submission can be re-indexed");
    }

    await enqueueIndexing(submissionId);
    return submission;
  },
};
