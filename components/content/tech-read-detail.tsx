"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ApiError } from "../../lib/api-client";
import { useTechRead } from "../../hooks/use-tech-reads";
import { CATEGORY_LABELS } from "../../lib/category-labels";
import { MarkdownView } from "./markdown-view";
import { StatusBadge } from "../shared/status-badge";
import { CommentSection } from "../comments/comment-section";

export function TechReadDetail({ slug }: { slug: string }) {
  const { data: techRead, isPending, isError, error } = useTechRead(slug);

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm text-destructive">
          {error instanceof ApiError ? error.message : "Failed to load this tech read"}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/tech-reads">
            <ArrowLeft className="h-4 w-4" />
            Back to tech reads
          </Link>
        </Button>
      </div>
    );
  }

  if (!techRead) return null;

  return (
    <article className="space-y-6">
      <div>
        <Link
          href="/tech-reads"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tech reads
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {techRead.category && <Badge variant="outline">{CATEGORY_LABELS[techRead.category]}</Badge>}
          {techRead.status !== "PUBLISHED" && <StatusBadge status={techRead.status} />}
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{techRead.title}</h1>
        {techRead.description && <p className="mt-2 text-muted-foreground">{techRead.description}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {techRead.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs font-normal">
              {tag}
            </Badge>
          ))}
        </div>
        <a
          href={techRead.externalUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          Read the source{techRead.sourceName ? ` on ${techRead.sourceName}` : ""}
        </a>
      </div>

      {techRead.currentSubmission?.content && (
        <MarkdownView content={techRead.currentSubmission.content} />
      )}

      {techRead.status === "PUBLISHED" && (
        <CommentSection parentType="techRead" parentId={techRead.id} />
      )}
    </article>
  );
}
