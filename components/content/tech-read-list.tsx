"use client";

import { useState } from "react";
import Link from "next/link";
import { BookMarked, ExternalLink, Plus } from "lucide-react";
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
import { useTechReads } from "../../hooks/use-tech-reads";
import { useCurrentUser } from "../../hooks/use-current-user";
import { canCreateContent } from "../../hooks/use-role";
import { EmptyState } from "../shared/empty-state";
import { CATEGORY_LABELS, CATEGORY_VALUES } from "../../lib/category-labels";

const ALL_CATEGORIES = "ALL" as const;

export function TechReadList() {
  const [category, setCategory] = useState<CategoryInput | typeof ALL_CATEGORIES>(ALL_CATEGORIES);
  const { role } = useCurrentUser();
  const { data, isPending, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useTechReads({
      category: category === ALL_CATEGORIES ? undefined : category,
    });

  const techReads = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tech Reads</h1>
          <p className="text-sm text-muted-foreground">
            Curated external articles, talks, and papers worth your time.
          </p>
        </div>
        {canCreateContent(role) && (
          <Button asChild>
            <Link href="/tech-reads/new">
              <Plus className="h-4 w-4" />
              New Tech Read
            </Link>
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
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
      </div>

      {isPending && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <span>{error instanceof Error ? error.message : "Failed to load tech reads"}</span>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isPending && !isError && techReads.length === 0 && (
        <EmptyState
          icon={BookMarked}
          title="No tech reads yet"
          description="Nothing has been curated in this category yet."
        />
      )}

      {!isPending && !isError && techReads.length > 0 && (
        <ul className="space-y-3">
          {techReads.map((techRead) => (
            <li key={techRead.id}>
              <Link
                href={`/tech-reads/${techRead.slug}`}
                className="block rounded-lg border border-border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="flex items-center gap-2 font-medium leading-snug">
                    {techRead.title}
                  </h2>
                  {techRead.category && (
                    <Badge variant="outline" className="shrink-0">
                      {CATEGORY_LABELS[techRead.category]}
                    </Badge>
                  )}
                </div>
                {techRead.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {techRead.description}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {techRead.sourceName && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <ExternalLink className="h-3 w-3" />
                      {techRead.sourceName}
                    </span>
                  )}
                  {techRead.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs font-normal">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
