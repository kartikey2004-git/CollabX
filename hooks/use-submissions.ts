"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Submission } from "@/lib/db";
import type {
  ContentStatusInput,
  CreateSubmissionInput,
  IndexStatusInput,
  ReviewSubmissionInput,
  UpdateSubmissionInput,
} from "@/lib/validation";
import { apiClient, ApiError, ListResult } from "../lib/api-client";
import { buildQuery } from "../lib/query-string";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export type ParentType = "article" | "techRead";

// The nested submission routes are mounted at /articles/:articleId/submissions and
// /tech-reads/:techReadId/submissions respectively — see apps/api/src/routes/v1.routes.ts.
function parentBasePath(parentType: ParentType): string {
  return parentType === "article" ? "/api/v1/articles" : "/api/v1/tech-reads";
}

export const submissionHistoryQueryKey = (parentType: ParentType, parentId: string) =>
  ["submissions", "history", parentType, parentId] as const;

export const submissionQueryKey = (id: string) => ["submissions", "detail", id] as const;

export const reviewQueueQueryKey = (status: ContentStatusInput = "PENDING_REVIEW") =>
  ["submissions", "queue", status] as const;

// GET /articles/:articleId/submissions or /tech-reads/:techReadId/submissions — the full version
// history (all statuses) for one piece of content, visible only to its owner or an ADMIN. Used by
// the "my content" dashboard to find each item's latest submission (status, rejectionReason) since
// that isn't denormalized onto the Article/TechRead row itself for anything but the PUBLISHED
// version — see docs/changes/004-backend-changes.md's note on Article/TechRead.status.
export function useSubmissionHistory(parentType: ParentType, parentId: string) {
  return useQuery({
    queryKey: submissionHistoryQueryKey(parentType, parentId),
    queryFn: () =>
      apiClient.get<ListResult<Submission>>(
        `${parentBasePath(parentType)}/${parentId}/submissions${buildQuery({ limit: 20 })}`,
      ),
    enabled: Boolean(parentId),
  });
}

// POST .../submissions — creates the next version against an Article/TechRead the caller owns (or
// is ADMIN for). Used both for "create a new version" after a REJECTED submission and (indirectly)
// whenever a fresh Article/TechRead is created via useCreateArticle/useCreateTechRead.
export function useCreateSubmission(parentType: ParentType, parentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSubmissionInput) =>
      apiClient.post<Submission>(`${parentBasePath(parentType)}/${parentId}/submissions`, input),
    onSuccess: () => {
      toast.success("New version created as a draft");
    },
    onError: (error) => {
      toast.error(
        errorMessage(
          error,
          "Failed to create a new version — a submission may already be in progress",
        ),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: submissionHistoryQueryKey(parentType, parentId) });
      queryClient.invalidateQueries({ queryKey: ["articles", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["tech-reads", "mine"] });
    },
  });
}

// POST /submissions/:id/submit — DRAFT -> PENDING_REVIEW.
export function useSubmitForReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (submissionId: string) =>
      apiClient.post<Submission>(`/api/v1/submissions/${submissionId}/submit`),
    onSuccess: () => {
      toast.success("Submitted for review");
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Failed to submit for review"));
    },
    onSettled: (_data, _error, submissionId) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(submissionId) });
      queryClient.invalidateQueries({ queryKey: ["submissions", "history"] });
      queryClient.invalidateQueries({ queryKey: ["articles", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["tech-reads", "mine"] });
    },
  });
}

// GET /submissions/:id — owner, ADMIN, or (if PUBLISHED) anyone. Polls every 2s while indexing is
// in flight (INDEXING is normally transient, a few seconds — see lib/inngest/functions.ts) so an
// admin watching this page sees it flip to INDEXED without a manual refresh; stops polling for
// every other state.
export function useSubmission(id: string) {
  return useQuery({
    queryKey: submissionQueryKey(id),
    queryFn: () => apiClient.get<Submission>(`/api/v1/submissions/${id}`),
    enabled: Boolean(id),
    refetchInterval: (query) => (query.state.data?.indexStatus === "INDEXING" ? 2000 : false),
  });
}

// PATCH /submissions/:id — in-place edit of a DRAFT/PENDING_REVIEW submission's own
// title/summary/content. Used both by the contributor (their own draft/pending submission) and by
// an admin editing during review — see submission.service.ts's `update`.
export function useUpdateSubmission(submissionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateSubmissionInput) =>
      apiClient.patch<Submission>(`/api/v1/submissions/${submissionId}`, input),
    onSuccess: () => {
      toast.success("Changes saved");
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Failed to save changes"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(submissionId) });
      queryClient.invalidateQueries({ queryKey: ["submissions", "history"] });
      queryClient.invalidateQueries({ queryKey: ["submissions", "queue"] });
    },
  });
}

// GET /submissions — the ADMIN moderation queue, oldest-first, cursor-paginated via "Load more".
export function useReviewQueue(status: ContentStatusInput = "PENDING_REVIEW") {
  return useInfiniteQuery({
    queryKey: reviewQueueQueryKey(status),
    queryFn: ({ pageParam }: { pageParam: string | null }) =>
      apiClient.get<ListResult<Submission>>(
        `/api/v1/submissions${buildQuery({ status, cursor: pageParam ?? undefined })}`,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined),
  });
}

// PATCH /submissions/:id/review — ADMIN-only publish/reject.
export function useReviewSubmission(submissionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReviewSubmissionInput) =>
      apiClient.patch<Submission>(`/api/v1/submissions/${submissionId}/review`, input),
    onSuccess: (submission) => {
      toast.success(
        submission.status === "PUBLISHED" ? "Published" : "Submission rejected",
      );
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Failed to review submission"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(submissionId) });
      queryClient.invalidateQueries({ queryKey: ["submissions", "queue"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["tech-reads"] });
    },
  });
}

export const indexingDashboardQueryKey = (indexStatus?: IndexStatusInput) =>
  ["submissions", "indexing", indexStatus ?? null] as const;

// GET /submissions/indexing — ADMIN-only "Indexing" dashboard, cursor-paginated via "Load more"
// (same pattern as useReviewQueue).
export function useIndexingDashboard(indexStatus?: IndexStatusInput) {
  return useInfiniteQuery({
    queryKey: indexingDashboardQueryKey(indexStatus),
    queryFn: ({ pageParam }: { pageParam: string | null }) =>
      apiClient.get<ListResult<Submission>>(
        `/api/v1/submissions/indexing${buildQuery({ indexStatus, cursor: pageParam ?? undefined })}`,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined),
  });
}

// POST /submissions/:id/reindex — ADMIN-only manual re-enqueue.
export function useReindexSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (submissionId: string) =>
      apiClient.post<Submission>(`/api/v1/submissions/${submissionId}/reindex`),
    onSuccess: () => {
      toast.success("Re-indexing queued");
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Failed to queue re-indexing"));
    },
    onSettled: (_data, _error, submissionId) => {
      queryClient.invalidateQueries({ queryKey: submissionQueryKey(submissionId) });
      queryClient.invalidateQueries({ queryKey: ["submissions", "indexing"] });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({ queryKey: ["tech-reads"] });
    },
  });
}
