"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { reviewSubmissionSchema } from "@repo/validation";
import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Badge } from "@repo/ui/components/badge";
import { ApiError } from "../../lib/api-client";
import { useReviewSubmission, useSubmission } from "../../hooks/use-submissions";
import { MarkdownView } from "../content/markdown-view";
import { IndexingControl } from "./indexing-control";

// PATCH /submissions/:id/review — ADMIN-only publish/reject. `reviewSubmissionSchema` is a
// discriminated union on `action` (see @repo/validation) — REJECT requires a non-empty
// `rejectionReason`, validated client-side here before submit, mirroring the server's own
// discriminated-union 400 on a REJECT with no reason.

export function ReviewDetail({ submissionId }: { submissionId: string }) {
  const { data: submission, isPending, isError, error } = useSubmission(submissionId);
  const reviewSubmission = useReviewSubmission(submissionId);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

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

  return (
    <div className="space-y-6">
      <Link
        href="/admin/review"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to queue
      </Link>

      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{submission.articleId ? "Article" : "Tech Read"}</Badge>
          <Badge variant="outline">v{submission.version}</Badge>
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{submission.title}</h1>
        {submission.summary && <p className="mt-1 text-muted-foreground">{submission.summary}</p>}
      </div>

      <MarkdownView content={submission.content} />

      {isDecided ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This submission has already been {submission.status.toLowerCase()}.
          </p>
          {submission.status === "PUBLISHED" && <IndexingControl submission={submission} />}
        </div>
      ) : (
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
