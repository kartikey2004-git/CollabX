"use client";

import { useState } from "react";
import { Database } from "lucide-react";
import type { IndexStatusInput } from "@repo/validation";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { useIndexingDashboard, useReindexSubmission } from "../../hooks/use-submissions";
import { IndexingStatusBadge } from "../shared/indexing-status-badge";
import { EmptyState } from "../shared/empty-state";

const FILTERS: { label: string; value: IndexStatusInput | "ALL" }[] = [
  { label: "All published content", value: "ALL" },
  { label: "Not indexed", value: "NOT_INDEXED" },
  { label: "Indexing", value: "INDEXING" },
  { label: "Indexed", value: "INDEXED" },
  { label: "Stale", value: "STALE" },
];

// ADMIN-only dashboard for the AI-search/indexing pipeline: every PUBLISHED submission, its
// indexStatus, and a manual "Re-index" trigger — GET /submissions/indexing +
// POST /submissions/:id/reindex. Same skeleton/error/empty/"Load more" shape as
// review-queue-list.tsx.

export function IndexingDashboardList() {
  const [filter, setFilter] = useState<IndexStatusInput | "ALL">("ALL");
  const indexStatus = filter === "ALL" ? undefined : filter;

  const { data, isPending, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useIndexingDashboard(indexStatus);
  const reindex = useReindexSubmission();

  const submissions = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Indexing</h1>
          <p className="text-sm text-muted-foreground">
            AI search indexing status for every published article and tech read.
          </p>
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as IndexStatusInput | "ALL")}>
          <SelectTrigger size="sm" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isPending && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <span>Failed to load the indexing dashboard</span>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isPending && !isError && submissions.length === 0 && (
        <EmptyState
          icon={Database}
          title="Nothing here"
          description="No published content matches this filter."
        />
      )}

      {!isPending && !isError && submissions.length > 0 && (
        <ul className="space-y-3">
          {submissions.map((submission) => {
            const isBusy =
              submission.indexStatus === "INDEXING" ||
              (reindex.isPending && reindex.variables === submission.id);

            return (
              <li key={submission.id} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{submission.articleId ? "Article" : "Tech Read"}</Badge>
                      <Badge variant="outline">v{submission.version}</Badge>
                      <IndexingStatusBadge status={submission.indexStatus} />
                    </div>
                    <h2 className="mt-1 truncate font-medium">{submission.title}</h2>
                    {submission.lastIndexedAt && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Last indexed {new Date(submission.lastIndexedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => reindex.mutate(submission.id)}
                    disabled={isBusy}
                  >
                    {isBusy ? "Indexing..." : "Re-index"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {hasNextPage && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
