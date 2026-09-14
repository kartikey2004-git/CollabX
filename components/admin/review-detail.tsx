"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { reviewSubmissionSchema, updateSubmissionSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MarkdownEditor } from "@/components/content/markdown-editor";
import { ApiError } from "../../lib/api-client";
import { useReviewSubmission, useSubmission, useUpdateSubmission } from "../../hooks/use-submissions";
import { MarkdownView } from "../content/markdown-view";
import { IndexingControl } from "./indexing-control";

// PATCH /submissions/:id/review — ADMIN-only publish/reject. `reviewSubmissionSchema` is a
// discriminated union on `action` (see @/lib/validation) — REJECT requires a non-empty
// `rejectionReason`, validated client-side here before submit, mirroring the server's own
// discriminated-union 400 on a REJECT with no reason.

export function ReviewDetail({ submissionId }: { submissionId: string }) {
  const { data: submission, isPending, isError, error } = useSubmission(submissionId);
  const reviewSubmission = useReviewSubmission(submissionId);
  const updateSubmission = useUpdateSubmission(submissionId);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Re-sync the edit form whenever a fresh submission loads (including right after a save, so a
  // second edit pass starts from the just-saved content, not stale pre-save state).
  useEffect(() => {
    if (submission) {
      setEditTitle(submission.title);
      setEditSummary(submission.summary ?? "");
      setEditContent(submission.content);
    }
  }, [submission]);

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">
          {error instanceof ApiError ? error.message : "Failed to load this submission"}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/review">
            <ArrowLeft className="h-4 w-4" />
            Back to queue
          </Link>
        </Button>
      </div>
    );
  }

  if (!submission) return null;

  const isDecided = submission.status !== "PENDING_REVIEW";
  const canEdit = submission.status === "DRAFT" || submission.status === "PENDING_REVIEW";

  const handlePublish = () => {
    reviewSubmission.mutate({ action: "PUBLISH" });
  };

  const handleReject = (e: FormEvent) => {
    e.preventDefault();
    const result = reviewSubmissionSchema.safeParse({ action: "REJECT", rejectionReason });
    if (!result.success) {
      setRejectError(result.error.issues[0]?.message ?? "A rejection reason is required");
      return;
    }
    setRejectError("");
    reviewSubmission.mutate(result.data);
  };

  const handleCancelEdit = () => {
    setEditTitle(submission.title);
    setEditSummary(submission.summary ?? "");
    setEditContent(submission.content);
    setEditErrors({});
    setIsEditing(false);
  };

  const handleSaveEdit = (e: FormEvent) => {
    e.preventDefault();
    const result = updateSubmissionSchema.safeParse({
      title: editTitle,
      summary: editSummary || undefined,
      content: editContent,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") fieldErrors[key] = issue.message;
      }
      setEditErrors(fieldErrors);
      return;
    }

    setEditErrors({});
    updateSubmission.mutate(result.data, {
      onSuccess: () => setIsEditing(false),
    });
  };

  return (
    <div className="space-y-6">
      <Link
        href="/admin/review"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to queue
      </Link>

      {isEditing ? (
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{submission.articleId ? "Article" : "Tech Read"}</Badge>
            <Badge variant="outline">v{submission.version}</Badge>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rd-title">Title</Label>
            <Input
              id="rd-title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              disabled={updateSubmission.isPending}
            />
            {editErrors.title && <p className="text-sm text-destructive">{editErrors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rd-summary">Summary</Label>
            <Textarea
              id="rd-summary"
              value={editSummary}
              onChange={(e) => setEditSummary(e.target.value)}
              rows={2}
              disabled={updateSubmission.isPending}
            />
            {editErrors.summary && <p className="text-sm text-destructive">{editErrors.summary}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="rd-content">Content (Markdown)</Label>
            <MarkdownEditor
              id="rd-content"
              value={editContent}
              onChange={setEditContent}
              disabled={updateSubmission.isPending}
              height={480}
            />
            {editErrors.content && <p className="text-sm text-destructive">{editErrors.content}</p>}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelEdit}
              disabled={updateSubmission.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateSubmission.isPending}>
              {updateSubmission.isPending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{submission.articleId ? "Article" : "Tech Read"}</Badge>
                <Badge variant="outline">v{submission.version}</Badge>
              </div>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">{submission.title}</h1>
              {submission.summary && <p className="mt-1 text-muted-foreground">{submission.summary}</p>}
            </div>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>

          <MarkdownView content={submission.content} />
        </>
      )}

      {!isEditing && isDecided && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This submission has already been {submission.status.toLowerCase()}.
          </p>
          {submission.status === "PUBLISHED" && <IndexingControl submission={submission} />}
        </div>
      )}

      {!isEditing && !isDecided && (
        <div className="space-y-4 rounded-lg border border-border p-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={handlePublish} disabled={reviewSubmission.isPending}>
              {reviewSubmission.isPending ? "Publishing..." : "Publish"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowRejectForm((v) => !v)}
              disabled={reviewSubmission.isPending}
            >
              Reject
            </Button>
          </div>

          {showRejectForm && (
            <form onSubmit={handleReject} className="space-y-2">
              <Textarea
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  setRejectError("");
                }}
                placeholder="Explain why this submission is being rejected..."
                disabled={reviewSubmission.isPending}
              />
              {rejectError && <p className="text-sm text-destructive">{rejectError}</p>}
              <div className="flex justify-end">
                <Button type="submit" variant="destructive" disabled={reviewSubmission.isPending}>
                  {reviewSubmission.isPending ? "Rejecting..." : "Confirm reject"}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
