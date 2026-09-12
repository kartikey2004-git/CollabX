"use client";

import Link from "next/link";
import { Inbox } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useReviewQueue } from "../../hooks/use-submissions";
import { EmptyState } from "../shared/empty-state";

// GET /submissions — ADMIN-only moderation queue, always PENDING_REVIEW, oldest-submittedAt-first
// (see docs/changes/004-backend-changes.md — this ordering is fixed server-side, not a UI choice).

export function ReviewQueueList() {
  const { data, isPending, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useReviewQueue("PENDING_REVIEW");

  const submissions = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Review Queue</h1>
        <p className="text-sm text-muted-foreground">Pending submissions, oldest first.</p>
      </div>

      {isPending && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <span>Failed to load the review queue</span>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isPending && !isError && submissions.length === 0 && (
        <EmptyState
          icon={Inbox}
          title="Nothing to review"
          description="The moderation queue is empty right now."
        />
      )}

      {!isPending && !isError && submissions.length > 0 && (
        <ul className="space-y-3">
          {submissions.map((submission) => (
            <li key={submission.id}>
              <Link
                href={`/admin/review/${submission.id}`}
                className="block rounded-lg border border-border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-medium">{submission.title}</h2>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline">{submission.articleId ? "Article" : "Tech Read"}</Badge>
                    <Badge variant="outline">v{submission.version}</Badge>
                  </div>
                </div>
                {submission.summary && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{submission.summary}</p>
                )}
                {submission.submittedAt && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Submitted {new Date(submission.submittedAt).toLocaleString()}
                  </p>
                )}
              </Link>
            </li>
          ))}
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
