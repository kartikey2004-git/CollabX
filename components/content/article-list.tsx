"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryInput } from "@/lib/validation";
import { useArticles } from "../../hooks/use-articles";
import { useCurrentUser } from "../../hooks/use-current-user";
import { canCreateContent } from "../../hooks/use-role";
import { useInfiniteScrollTrigger } from "../../hooks/use-infinite-scroll-trigger";
import { EmptyState } from "../shared/empty-state";
import { CATEGORY_LABELS, CATEGORY_VALUES } from "../../lib/category-labels";

const ALL_CATEGORIES = "ALL" as const;

// GET /articles is public — PUBLISHED-only content, readable without a session (see
// apps/api/src/middleware/auth.middleware.ts's optionalAuth and apps/web/middleware.ts).

export function ArticleList() {
  const [category, setCategory] = useState<CategoryInput | typeof ALL_CATEGORIES>(ALL_CATEGORIES);
  const { role } = useCurrentUser();
  const { data, isPending, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useArticles(category === ALL_CATEGORIES ? {} : { category });

  const sentinelRef = useInfiniteScrollTrigger(hasNextPage, isFetchingNextPage, fetchNextPage);

  const articles = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Articles</h1>
          <p className="text-sm text-muted-foreground">
            Engineering knowledge published by the community.
          </p>
        </div>
        {canCreateContent(role) && (
          <Button asChild>
            <Link href="/articles/new">
              <Plus className="h-4 w-4" />
              New Article
            </Link>
          </Button>
        )}
      </div>

      <Select
        value={category}
        onValueChange={(value) => setCategory(value as CategoryInput | typeof ALL_CATEGORIES)}
      >
        <SelectTrigger className="w-full sm:w-64">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
          {CATEGORY_VALUES.map((value) => (
            <SelectItem key={value} value={value}>
              {CATEGORY_LABELS[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isPending && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <span>{error instanceof Error ? error.message : "Failed to load articles"}</span>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isPending && !isError && articles.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No articles yet"
          description="Nothing has been published in this category yet — check back soon."
        />
      )}

      {!isPending && !isError && articles.length > 0 && (
        <ul className="space-y-3">
          {articles.map((article) => (
            <li key={article.id}>
              <Link
                href={`/articles/${article.slug}`}
                className="block rounded-lg border border-border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-medium leading-snug">{article.title}</h2>
                  <Badge variant="outline" className="shrink-0">
                    {CATEGORY_LABELS[article.category]}
                  </Badge>
                </div>
                {article.summary && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {article.summary}
                  </p>
                )}
                {article.publishedAt && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(article.publishedAt).toLocaleDateString()}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {hasNextPage && (
        <div ref={sentinelRef} className="flex justify-center pt-2" aria-hidden={!isFetchingNextPage}>
          {isFetchingNextPage && (
            <Skeleton className="h-24 w-full rounded-lg" aria-label="Loading more articles" />
          )}
        </div>
      )}
    </div>
  );
}
