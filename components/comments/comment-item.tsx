"use client";

import { Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CommentWithUser } from "../../lib/content-types";

interface CommentItemProps {
  comment: CommentWithUser;
  replies: CommentWithUser[];
  currentUserId?: string;
  canModerateAll?: boolean;
  onReply: () => void;
  // eslint-disable-next-line no-unused-vars -- named for readability; this is a type position, not a real binding
  onDelete: (id: string) => void;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// One comment row — reused for both a top-level comment and each of its (one level of) replies.
// `isDeleted` renders a "[deleted]" placeholder instead of the body, per
// docs/changes/004-backend-changes.md judgment call #7: soft-deleted comments are still returned
// by the API (so replies aren't orphaned) and it's the frontend's job to hide the body.

function CommentRow({
  comment,
  currentUserId,
  canModerateAll,
  onReply,
  onDelete,
  isReply,
}: {
  comment: CommentWithUser;
  currentUserId?: string;
  canModerateAll?: boolean;
  onReply?: () => void;
  // eslint-disable-next-line no-unused-vars -- named for readability; this is a type position, not a real binding
  onDelete: (id: string) => void;
  isReply?: boolean;
}) {
  const isDeleted = Boolean(comment.deletedAt);
  const canDelete = !isDeleted && (comment.userId === currentUserId || canModerateAll);

  return (
    <div className={`flex gap-3 ${isReply ? "ml-10" : ""}`}>
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={comment.user.image ?? ""} alt={comment.user.name} />
        <AvatarFallback>{initials(comment.user.name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{comment.user.name}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(comment.createdAt).toLocaleDateString()}
          </span>
        </div>
        <p className={isDeleted ? "text-sm italic text-muted-foreground" : "text-sm"}>
          {isDeleted ? "[deleted]" : comment.body}
        </p>
        {!isDeleted && (
          <div className="flex gap-3">
            {onReply && (
              <button
                type="button"
                className="text-xs text-muted-foreground hover:underline"
                onClick={onReply}
              >
                Reply
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-destructive hover:underline"
                onClick={() => onDelete(comment.id)}
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function CommentItem({
  comment,
  replies,
  currentUserId,
  canModerateAll,
  onReply,
  onDelete,
}: CommentItemProps) {
  return (
    <li className="space-y-3">
      <CommentRow
        comment={comment}
        currentUserId={currentUserId}
        canModerateAll={canModerateAll}
        onReply={onReply}
        onDelete={onDelete}
      />
      {replies.length > 0 && (
        <div className="space-y-3">
          {replies.map((reply) => (
            <CommentRow
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              canModerateAll={canModerateAll}
              onDelete={onDelete}
              isReply
            />
          ))}
        </div>
      )}
    </li>
  );
}
