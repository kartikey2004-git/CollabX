"use client";

import { useState, type FormEvent } from "react";
import { updateSubmissionSchema } from "@/lib/validation";
import type { Submission } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MarkdownEditor } from "@/components/content/markdown-editor";
import { useUpdateSubmission } from "../../hooks/use-submissions";

interface EditSubmissionDialogProps {
  submission: Submission;
  open: boolean;
  // eslint-disable-next-line no-unused-vars -- named for readability; this is a type position, not a real binding
  onOpenChange: (open: boolean) => void;
}

// In-place edit of the current DRAFT or PENDING_REVIEW submission (PATCH .../submissions/:id) —
// unlike NewVersionDialog, this does NOT create a new version. It's for fixing the version that's
// still being worked on: a draft that hasn't been submitted yet, or one already sitting in the
// admin queue that needs a quick correction before it's decided (see
// submission.service.ts::update for the exact status rule).

export function EditSubmissionDialog({ submission, open, onOpenChange }: EditSubmissionDialogProps) {
  const [title, setTitle] = useState(submission.title);
  const [summary, setSummary] = useState(submission.summary ?? "");
  const [content, setContent] = useState(submission.content);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const updateSubmission = useUpdateSubmission(submission.id);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const result = updateSubmissionSchema.safeParse({
      title,
      summary: summary || undefined,
      content,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    updateSubmission.mutate(result.data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!updateSubmission.isPending) onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-4xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit v{submission.version}</DialogTitle>
            <DialogDescription>
              {submission.status === "PENDING_REVIEW"
                ? "This submission is awaiting review — saving updates it in place, it stays the same version."
                : "Saving updates this draft in place."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 max-h-[75vh] space-y-4 overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label htmlFor="es-title">Title</Label>
              <Input
                id="es-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={updateSubmission.isPending}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="es-summary">Summary</Label>
              <Textarea
                id="es-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                disabled={updateSubmission.isPending}
              />
              {errors.summary && <p className="text-sm text-destructive">{errors.summary}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="es-content">Content (Markdown)</Label>
              <MarkdownEditor
                id="es-content"
                value={content}
                onChange={setContent}
                disabled={updateSubmission.isPending}
                height={420}
              />
              {errors.content && <p className="text-sm text-destructive">{errors.content}</p>}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateSubmission.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateSubmission.isPending}>
              {updateSubmission.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
