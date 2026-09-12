"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Article } from "@repo/database";
import type { CategoryInput, ContentStatusInput, CreateArticleInput } from "@repo/validation";
import { apiClient, ApiError, ListResult } from "../lib/api-client";
import { buildQuery } from "../lib/query-string";
import type { ArticleWithSubmission, CreateArticleResult } from "../lib/content-types";

// A readable message to show the user: our API's own error message if we have one, otherwise a generic fallback string.
function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export interface ArticleFilters {
  category?: CategoryInput;
}

export interface MyArticleFilters {
  status?: ContentStatusInput;
  category?: CategoryInput;
}

export const articlesQueryKey = (filters: ArticleFilters = {}) =>
  ["articles", "list", filters] as const;

export const articleQueryKey = (slug: string) => ["articles", "slug", slug] as const;

export const myArticlesQueryKey = (filters: MyArticleFilters = {}) =>
  ["articles", "mine", filters] as const;

export const articleNavQueryKey = () => ["articles", "nav"] as const;

// GET /articles — the public (PUBLISHED-only) list, filterable by category, cursor-paginated via a
// "Load more" button (see the `nextCursor`/`hasMore` shape ListMeta/ListResult already define).
export function useArticles(filters: ArticleFilters = {}) {
  return useInfiniteQuery({
    queryKey: articlesQueryKey(filters),
    queryFn: ({ pageParam }: { pageParam: string | null }) =>
      apiClient.get<ListResult<Article>>(
        `/api/v1/articles${buildQuery({ category: filters.category, cursor: pageParam ?? undefined })}`,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => (lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined),
  });
}

// GET /articles/slug/:slug — a single published article's full detail (including the current
// submission's Markdown content), or the caller's own unpublished draft/pending/rejected article.
export function useArticle(slug: string) {
  return useQuery({
    queryKey: articleQueryKey(slug),
    queryFn: () => apiClient.get<ArticleWithSubmission>(`/api/v1/articles/slug/${slug}`),
    enabled: Boolean(slug),
  });
}

// GET /articles/mine — the current user's own articles (CONTRIBUTOR) or every non-deleted article
// platform-wide (ADMIN), any status. Powers the "My content" dashboard. Not infinite-scrolled — a
// contributor's own content list is expected to be small, so one larger page (50) is fetched.
export function useMyArticles(filters: MyArticleFilters = {}) {
  return useQuery({
    queryKey: myArticlesQueryKey(filters),
    queryFn: () =>
      apiClient.get<ListResult<Article>>(
        `/api/v1/articles/mine${buildQuery({ status: filters.status, category: filters.category, limit: 50 })}`,
      ),
  });
}

// GET /articles?limit=100&sortBy=publishedAt&sortOrder=asc — powers the docs-style sidebar's
// category-grouped, chapter-numbered nav (app-sidebar.tsx groups/numbers this client-side) and
// ArticleDetail's "chapter N of category" header. One request covers the whole published catalog
// at current volume (100 is the backend's hard cap — see packages/validation/src/common.schema.ts).
// If `meta.hasMore` ever comes back true this list is silently missing later-published articles;
// fine today (well under 100 total), but worth revisiting (raise the limit, or move the grouping
// server-side) if the catalog grows to approach it.
export function useArticleNav() {
  return useQuery({
    queryKey: articleNavQueryKey(),
    queryFn: () =>
      apiClient.get<ListResult<Article>>(
        `/api/v1/articles${buildQuery({ limit: 100, sortBy: "publishedAt", sortOrder: "asc" })}`,
      ),
    staleTime: 5 * 60 * 1000,
  });
}

// POST /articles — creates the Article + its v1 Submission together. CONTRIBUTOR/ADMIN only
// server-side; the "New Article" UI is hidden from READERs via useRole's canCreateContent, but this
// mutation still handles a stale-role 403 gracefully via the toast below.
export function useCreateArticle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateArticleInput) =>
      apiClient.post<CreateArticleResult>("/api/v1/articles", input),
    onSuccess: (result) => {
      toast.success(`"${result.article.title}" created as a draft`);
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Failed to create article"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["articles", "mine"] });
    },
  });
}
