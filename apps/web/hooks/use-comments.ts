"use client";

import { InfiniteData, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CreateCommentInput } from "@repo/validation";
import { apiClient, ApiError, ListResult } from "../lib/api-client";
import { buildQuery } from "../lib/query-string";
import type { CommentWithUser } from "../lib/content-types";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export type CommentParentType = "article" | "techRead";

function parentBasePath(parentType: CommentParentType): string {
  return parentType === "article" ? "/api/v1/articles" : "/api/v1/tech-reads";
}

export const commentsQueryKey = (parentType: CommentParentType, parentId: string) =>
  ["comments", parentType, parentId] as const;

// GET .../comments — a flat, newest-first, cursor-paginated list (the backend deliberately doesn't
// build a nested tree server-side — see docs/changes/004-backend-changes.md judgment call #6).
// Soft-deleted comments are still returned (deletedAt set, body intact) so replies aren't orphaned;
// components rendering this list are responsible for showing a "[deleted]" placeholder instead of
// `.body` whenever `deletedAt` is set.
export function useComments(parentType: CommentParentType, parentId: string) {
  return useInfiniteQuery({
    queryKey: commentsQueryKey(parentType, parentId),
    queryFn: ({ pageParam }: { pageParam: string | null }) =>
      apiClient.get<ListResult<CommentWithUser>>(
        `${parentBasePath(parentType)}/${parentId}/comments${buildQuery({ cursor: pageParam ?? undefined })}`,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined),
    enabled: Boolean(parentId),
  });
}

// POST .../comments — any authenticated Role (READER included). Only reachable on PUBLISHED
// content; the backend 403s a comment attempt on an unpublished Article/TechRead.
export function useCreateComment(parentType: CommentParentType, parentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCommentInput) =>
      apiClient.post<CommentWithUser>(`${parentBasePath(parentType)}/${parentId}/comments`, input),
    onSuccess: () => {
      toast.success("Comment posted");
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Failed to post comment"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: commentsQueryKey(parentType, parentId) });
    },
  });
}

// DELETE /comments/:id — soft-delete only (author or ADMIN; enforced server-side). Optimistically
// marks the comment as deleted in the cached pages so the UI shows "[deleted]" immediately, rather
// than removing the row outright — a hard removal would visually orphan any still-visible replies.
export function useDeleteComment(parentType: CommentParentType, parentId: string) {
  const queryClient = useQueryClient();
  const queryKey = commentsQueryKey(parentType, parentId);

  return useMutation({
    mutationFn: (commentId: string) =>
      apiClient.delete<CommentWithUser>(`/api/v1/comments/${commentId}`),
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<InfiniteData<ListResult<CommentWithUser>>>(queryKey);

      queryClient.setQueryData<InfiniteData<ListResult<CommentWithUser>>>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            items: page.items.map((comment) =>
              comment.id === commentId ? { ...comment, deletedAt: new Date() } : comment,
            ),
          })),
        };
      });

      return { previous };
    },
    onError: (error, _commentId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(errorMessage(error, "Failed to delete comment"));
    },
    onSuccess: () => {
      toast.success("Comment deleted");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
