"use client";

import type { IndexStatusInput } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { useReindexSubmission } from "../../hooks/use-submissions";
import { IndexingStatusBadge } from "../shared/indexing-status-badge";

interface IndexingControlProps {
  submission: { id: string; indexStatus: IndexStatusInput; lastIndexedAt: string | Date | null };
}

// ADMIN-only AI-indexing status + manual "Re-index" trigger (POST /submissions/:id/reindex).
// Gating is the caller's job (canModerate(role) at the call site), same convention as
// TrendingControl — this component itself doesn't check role. Only meaningful for a PUBLISHED
// submission (the only kind that's ever eligible for indexing — see submission.service.ts::
// reindex), so callers should only render this once they already know that.

export function IndexingControl({ submission }: IndexingControlProps) {
  const reindex = useReindexSubmission();
  const isBusy = submission.indexStatus === "INDEXING" || reindex.isPending;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border p-3 text-sm">
      <span className="font-medium text-muted-foreground">Admin: AI indexing</span>
      <IndexingStatusBadge status={submission.indexStatus} />
      {submission.lastIndexedAt && (
        <span className="text-xs text-muted-foreground">
          Last indexed {new Date(submission.lastIndexedAt).toLocaleString()}
        </span>
      )}
      <Button
        size="sm"
        variant="outline"
        onClick={() => reindex.mutate(submission.id)}
        disabled={isBusy}
      >
        {isBusy ? "Indexing..." : "Re-index"}
      </Button>
    </div>
  );
}
