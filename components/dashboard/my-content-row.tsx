"use client";

import { useState } from "react";
import Link from "next/link";
import type { Article, TechRead } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useSubmissionHistory, useSubmitForReview, type ParentType } from "../../hooks/use-submissions";
import { useDeleteTechRead } from "../../hooks/use-tech-reads";
import { useCurrentUser } from "../../hooks/use-current-user";
import { canModerate } from "../../hooks/use-role";
import { StatusBadge } from "../shared/status-badge";
import { NewVersionDialog } from "./new-version-dialog";
import { EditSubmissionDialog } from "./edit-submission-dialog";

interface MyContentRowProps {
  parentType: ParentType;
  item: Article | TechRead;
}

/*

One row in the "My Content" dashboard. Article/TechRead.status only reflects the currently
PUBLISHED version (it's denormalized from currentSubmission, updated only on publish — see
schema.prisma's comment on Article.status) — it does NOT tell you whether a newer DRAFT/
PENDING_REVIEW/REJECTED submission exists on top of a published item, or what a never-published
item's real status is. So this row fetches the item's own submission history
(GET .../submissions, owner/ADMIN only) and reads the latest version's status instead of the
parent's, to decide which action (if any) to offer:

- latest DRAFT -> "Submit for review"
- latest REJECTED (shows rejectionReason) or PUBLISHED -> "Create new version"
- latest PENDING_REVIEW -> no action, just "Awaiting review"

*/

export function MyContentRow({ parentType, item }: MyContentRowProps) {
  const { data, isPending, isError } = useSubmissionHistory(parentType, item.id);
  const submitForReview = useSubmitForReview();
  const deleteTechRead = useDeleteTechRead();
  const { role } = useCurrentUser();
  const [newVersionOpen, setNewVersionOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // submissionHistoryQuerySchema defaults to sortBy=version, sortOrder=desc, so items[0] is latest.
  const latest = data?.items[0];

  const detailHref = parentType === "article" ? `/articles/${item.slug}` : `/tech-reads/${item.slug}`;

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <Link href={detailHref} className="font-medium hover:underline">
          {item.title}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {isPending && <span className="text-xs text-muted-foreground">Loading status...</span>}
          {isError && <span className="text-xs text-destructive">Failed to load status</span>}
          {latest && (
            <>
              <StatusBadge status={latest.status} />
              <span className="text-xs text-muted-foreground">v{latest.version}</span>
            </>
          )}
          {latest?.status === "PENDING_REVIEW" && (
            <span className="text-xs text-muted-foreground">Awaiting review</span>
          )}
        </div>
        {latest?.status === "REJECTED" && latest.rejectionReason && (
          <p className="text-xs text-destructive">Rejected: {latest.rejectionReason}</p>
        )}
      </div>

      <div className="flex shrink-0 gap-2">
        {(latest?.status === "DRAFT" || latest?.status === "PENDING_REVIEW") && (
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
        )}
        {latest?.status === "DRAFT" && (
          <Button
            size="sm"
            onClick={() => submitForReview.mutate(latest.id)}
            disabled={submitForReview.isPending}
          >
            {submitForReview.isPending ? "Submitting..." : "Submit for review"}
          </Button>
        )}
        {(latest?.status === "REJECTED" || latest?.status === "PUBLISHED") && (
          <Button size="sm" variant="outline" onClick={() => setNewVersionOpen(true)}>
            Create new version
          </Button>
        )}
        {parentType === "techRead" &&
          latest?.status === "REJECTED" &&
          item.status !== "PUBLISHED" &&
          canModerate(role) && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive" disabled={deleteTechRead.isPending}>
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this tech read?</AlertDialogTitle>
                <AlertDialogDescription>
                  &quot;{item.title}&quot; was rejected and has no published version. Deleting it removes it
                  from every list — this can&apos;t be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => deleteTechRead.mutate(item.id)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {latest && (
        <NewVersionDialog
          parentType={parentType}
          parentId={item.id}
          latestSubmission={latest}
          open={newVersionOpen}
          onOpenChange={setNewVersionOpen}
        />
      )}

      {latest && (latest.status === "DRAFT" || latest.status === "PENDING_REVIEW") && (
        <EditSubmissionDialog submission={latest} open={editOpen} onOpenChange={setEditOpen} />
      )}
    </li>
  );
}
