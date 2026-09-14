"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { TechRead } from "@/lib/db";
import type { CategoryInput, ContentStatusInput, CreateTechReadInput } from "@/lib/validation";
import { apiClient, ApiError, ListResult } from "../lib/api-client";
import { buildQuery } from "../lib/query-string";
import type { CreateTechReadResult, TechReadWithSubmission } from "../lib/content-types";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export interface TechReadFilters {
  category?: CategoryInput;
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

// GET /tech-reads — public (PUBLISHED-only) listing.
export function useTechReads(filters: TechReadFilters = {}) {
  return useInfiniteQuery({
    queryKey: techReadsQueryKey(filters),
    queryFn: ({ pageParam }: { pageParam: string | null }) =>
      apiClient.get<ListResult<TechRead>>(
        `/api/v1/tech-reads${buildQuery({
          category: filters.category,
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

// DELETE /tech-reads/:id — ADMIN-only soft-delete. Used from the dashboard to clear a rejected
// tech read out of the list entirely, instead of leaving a dead REJECTED row around forever.
export function useDeleteTechRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete<TechRead>(`/api/v1/tech-reads/${id}`),
    onSuccess: () => {
      toast.success("Tech read deleted");
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Failed to delete tech read"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tech-reads"] });
    },
  });
}
