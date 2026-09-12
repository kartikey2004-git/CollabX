"use client";

import { useState, type FormEvent } from "react";
import { z } from "zod";
import { createSubmissionSchema } from "@repo/validation";
import type { Submission } from "@repo/database";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Textarea } from "@repo/ui/components/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import { useCreateSubmission, type ParentType } from "../../hooks/use-submissions";

interface NewVersionDialogProps {
  parentType: ParentType;
  parentId: string;
  latestSubmission: Submission;
  open: boolean;
  // eslint-disable-next-line no-unused-vars -- named for readability; this is a type position, not a real binding
  onOpenChange: (open: boolean) => void;
}

// Creates the next version (POST .../submissions) against a REJECTED or already-PUBLISHED
// Article/TechRead — this is how a contributor edits content, since a rejected Submission is never
// mutated in place (see schema.prisma's comment on Submission). Pre-filled from the latest
// submission so the contributor is editing, not starting from scratch.

export function NewVersionDialog({
  parentType,
  parentId,
  latestSubmission,
  open,
  onOpenChange,
}: NewVersionDialogProps) {
  const [title, setTitle] = useState(latestSubmission.title);
  const [summary, setSummary] = useState(latestSubmission.summary ?? "");
  const [content, setContent] = useState(latestSubmission.content);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createSubmission = useCreateSubmission(parentType, parentId);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const result = createSubmissionSchema.safeParse({
      title,
      summary: summary || undefined,
      content,
    });

    if (!result.success) {
      const { fieldErrors } = z.flattenError(result.error);
      setErrors({
        title: fieldErrors.title?.[0] ?? "",
        summary: fieldErrors.summary?.[0] ?? "",
        content: fieldErrors.content?.[0] ?? "",
      });
      return;
    }

    setErrors({});
    createSubmission.mutate(result.data, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!createSubmission.isPending) onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create a new version</DialogTitle>
            <DialogDescription>
              This starts a new draft submission (v{latestSubmission.version + 1}) for review.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label htmlFor="nv-title">Title</Label>
              <Input
                id="nv-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={createSubmission.isPending}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nv-summary">Summary</Label>
              <Textarea
                id="nv-summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                disabled={createSubmission.isPending}
              />
              {errors.summary && <p className="text-sm text-destructive">{errors.summary}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nv-content">Content (Markdown)</Label>
              <Textarea
                id="nv-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={14}
                className="font-mono text-sm"
                disabled={createSubmission.isPending}
              />
              {errors.content && <p className="text-sm text-destructive">{errors.content}</p>}
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createSubmission.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createSubmission.isPending}>
              {createSubmission.isPending ? "Creating..." : "Create version"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
