"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { TechRead } from "@repo/database";
import type {
  CategoryInput,
  ContentStatusInput,
  CreateTechReadInput,
  UpdateTechReadTrendingInput,
} from "@repo/validation";
import { apiClient, ApiError, ListResult } from "../lib/api-client";
import { buildQuery } from "../lib/query-string";
import type { CreateTechReadResult, TechReadWithSubmission } from "../lib/content-types";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export interface TechReadFilters {
  category?: CategoryInput;
  isTrending?: boolean;
}

export interface MyTechReadFilters {
  status?: ContentStatusInput;
  category?: CategoryInput;
}

export const techReadsQueryKey = (filters: TechReadFilters = {}) =>
  ["tech-reads", "list", filters] as const;

export const techReadQueryKey = (slug: string) => ["tech-reads", "slug", slug] as const;

export const myTechReadsQueryKey = (filters: MyTechReadFilters = {}) =>
  ["tech-reads", "mine", filters] as const;

// GET /tech-reads — public (PUBLISHED-only) listing. `isTrending: true` narrows to the "Trending
// Tech Reads" feed, which the backend always sorts by trendingScore regardless of `sortBy`.
export function useTechReads(filters: TechReadFilters = {}) {
  return useInfiniteQuery({
    queryKey: techReadsQueryKey(filters),
    queryFn: ({ pageParam }: { pageParam: string | null }) =>
      apiClient.get<ListResult<TechRead>>(
        `/api/v1/tech-reads${buildQuery({
          category: filters.category,
          isTrending: filters.isTrending,
          cursor: pageParam ?? undefined,
        })}`,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined),
  });
}

export function useTechRead(slug: string) {
  return useQuery({
    queryKey: techReadQueryKey(slug),
    queryFn: () => apiClient.get<TechReadWithSubmission>(`/api/v1/tech-reads/slug/${slug}`),
    enabled: Boolean(slug),
  });
}

export function useMyTechReads(filters: MyTechReadFilters = {}) {
  return useQuery({
    queryKey: myTechReadsQueryKey(filters),
    queryFn: () =>
      apiClient.get<ListResult<TechRead>>(
        `/api/v1/tech-reads/mine${buildQuery({ status: filters.status, category: filters.category, limit: 50 })}`,
      ),
  });
}

export function useCreateTechRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTechReadInput) =>
      apiClient.post<CreateTechReadResult>("/api/v1/tech-reads", input),
    onSuccess: (result) => {
      toast.success(`"${result.techRead.title}" created as a draft`);
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Failed to create tech read"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tech-reads", "mine"] });
    },
  });
}

// PATCH /tech-reads/:id/trending — ADMIN-only toggle. The only direct-mutation endpoint on
// Article/TechRead's own row; everything else goes through the Submission review flow.
export function useUpdateTechReadTrending() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTechReadTrendingInput }) =>
      apiClient.patch<TechRead>(`/api/v1/tech-reads/${id}/trending`, input),
    onSuccess: () => {
      toast.success("Trending settings updated");
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Failed to update trending settings"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tech-reads"] });
    },
  });
}
