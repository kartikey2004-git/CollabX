"use client";

import { useState, type FormEvent } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";
import { Skeleton } from "@repo/ui/components/skeleton";
import { createCommentSchema } from "@repo/validation";
import {
  type CommentParentType,
  useComments,
  useCreateComment,
  useDeleteComment,
} from "../../hooks/use-comments";
import { useCurrentUser } from "../../hooks/use-current-user";
import { canModerate } from "../../hooks/use-role";
import type { CommentWithUser } from "../../lib/content-types";
import { CommentItem } from "./comment-item";

interface CommentSectionProps {
  parentType: CommentParentType;
  parentId: string;
}

// The comment list + create/reply form for a published Article/TechRead. Only rendered by the
// detail pages once the content is confirmed PUBLISHED — the backend 403s a comment attempt on
// unpublished content anyway (see docs/changes/004-backend-changes.md), but there's no reason to
// show a form that can't succeed.

export function CommentSection({ parentType, parentId }: CommentSectionProps) {
  const { user, role } = useCurrentUser();
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  const { data, isPending, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useComments(parentType, parentId);
  const createComment = useCreateComment(parentType, parentId);
  const deleteComment = useDeleteComment(parentType, parentId);

  const comments = data?.pages.flatMap((page) => page.items) ?? [];

  // The backend returns a flat list (see use-comments.ts's comment on this); build a
  // parentId -> replies map here so it renders as a two-level thread (top-level + direct replies).
  const topLevel = comments.filter((c) => !c.parentCommentId);
  const repliesByParent = new Map<string, CommentWithUser[]>();
  for (const comment of comments) {
    if (comment.parentCommentId) {
      const list = repliesByParent.get(comment.parentCommentId) ?? [];
      list.push(comment);
      repliesByParent.set(comment.parentCommentId, list);
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = createCommentSchema.safeParse({
      body,
      parentCommentId: replyTo ?? undefined,
    });
    if (!result.success) {
      setFormError(result.error.issues[0]?.message ?? "Invalid comment");
      return;
    }
    setFormError("");
    createComment.mutate(result.data, {
      onSuccess: () => {
        setBody("");
        setReplyTo(null);
      },
    });
  };

  return (
    <section className="space-y-4 border-t border-border pt-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <MessageSquare className="h-5 w-5" />
        Comments
      </h2>

      {user && (
        <form onSubmit={handleSubmit} className="space-y-2">
          {replyTo && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Replying to a comment</span>
              <button type="button" className="underline" onClick={() => setReplyTo(null)}>
                Cancel
              </button>
            </div>
          )}
          <Textarea
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setFormError("");
            }}
            placeholder="Add a comment..."
            disabled={createComment.isPending}
            maxLength={2000}
          />
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={createComment.isPending || !body.trim()}>
              {createComment.isPending ? "Posting..." : "Post comment"}
            </Button>
          </div>
        </form>
      )}

      {isPending && (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <span>Failed to load comments</span>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isPending && !isError && topLevel.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No comments yet — be the first to say something.
        </p>
      )}

      {!isPending && !isError && topLevel.length > 0 && (
        <ul className="space-y-4">
          {topLevel.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              replies={repliesByParent.get(comment.id) ?? []}
              currentUserId={user?.id}
              canModerateAll={canModerate(role)}
              onReply={() => setReplyTo(comment.id)}
              onDelete={(id) => deleteComment.mutate(id)}
            />
          ))}
        </ul>
      )}

      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading..." : "Load more comments"}
          </Button>
        </div>
      )}
    </section>
  );
}
