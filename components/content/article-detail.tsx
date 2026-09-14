"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ApiError } from "../../lib/api-client";
import { useArticle, useArticleNav } from "../../hooks/use-articles";
import { useScrollSpy } from "../../hooks/use-scroll-spy";
import { useCurrentUser } from "../../hooks/use-current-user";
import { canModerate } from "../../hooks/use-role";
import { CATEGORY_LABELS } from "../../lib/category-labels";
import { extractHeadings } from "../../lib/markdown-headings";
import { MarkdownView } from "./markdown-view";
import { StatusBadge } from "../shared/status-badge";
import { CommentSection } from "../comments/comment-section";
import { IndexingControl } from "../admin/indexing-control";
import { useToc } from "../layout/toc-context";

// GET /articles/slug/:slug — see docs/changes/004-backend-changes.md for the exact 404/403 shape:
// 404 means the slug genuinely doesn't resolve to anything; 403 means it exists but isn't
// PUBLISHED and the viewer isn't its owner/an ADMIN. Both come back as `ApiError.message` already
// written to be shown to the user (apps/api/src/lib/errors.ts), so this just displays it directly
// rather than a generic "something went wrong".

const WORDS_PER_MINUTE = 200;

function estimateReadMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function ArticleDetail({ slug }: { slug: string }) {
  const { data: article, isPending, isError, error } = useArticle(slug);
  const { data: nav } = useArticleNav();
  const { role } = useCurrentUser();
  const toc = useToc();

  const headings = useMemo(
    () => (article?.currentSubmission ? extractHeadings(article.currentSubmission.content) : []),
    [article],
  );
  const headingIds = useMemo(() => headings.map((h) => h.id), [headings]);
  const activeId = useScrollSpy(headingIds);

  // Pushes this article's headings/active section into the shared TocContext so the sidebar
  // (app-sidebar.tsx) can render them nested under this chapter. Cleared on unmount/navigation so a
  // stale TOC from the previous article never leaks into the sidebar for the next one.
  useEffect(() => {
    toc.setHeadings(headings);
    return () => toc.setHeadings([]);
  }, [headings, toc]);

  useEffect(() => {
    toc.setActiveId(activeId);
  }, [activeId, toc]);

  // Article content (and its heading ids) only exists after this client-side fetch resolves, so a
  // hard refresh/direct link to e.g. /articles/slug#architecture lands before the browser's own
  // fragment-navigation can find the target — it just gives up silently. Once the headings this
  // hash could refer to are actually in the DOM, do that positioning ourselves, once, instantly
  // (not the click-driven smooth scroll — this is initial placement, not a user-triggered jump).
  useEffect(() => {
    if (headingIds.length === 0) return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    document.getElementById(hash)?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [headingIds.join("|")]);

  // This article's position within its category's chapter list, from the same nav data the sidebar
  // groups/numbers with — keeps the header's "Part / Chapter N" chip consistent with the sidebar.
  const chapter = useMemo(() => {
    if (!nav || !article) return null;
    const siblings = nav.items.filter((item) => item.category === article.category);
    const index = siblings.findIndex((item) => item.slug === article.slug);
    return index === -1 ? null : { number: index + 1, of: siblings.length };
  }, [nav, article]);

  const readMinutes = useMemo(
    () => (article?.currentSubmission ? estimateReadMinutes(article.currentSubmission.content) : null),
    [article],
  );

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
          {error instanceof ApiError ? error.message : "Failed to load this article"}
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/articles">
            <ArrowLeft className="h-4 w-4" />
            Back to articles
          </Link>
        </Button>
      </div>
    );
  }

  if (!article) return null;

  return (
    <article className="space-y-6">
      <div>
        <Link
          href="/articles"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to articles
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span>
            {CATEGORY_LABELS[article.category]}
            {chapter && ` · Chapter ${String(chapter.number).padStart(2, "0")}`}
          </span>
          {readMinutes && <span>· {readMinutes} min read</span>}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {article.status !== "PUBLISHED" && <StatusBadge status={article.status} />}
        </div>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{article.title}</h1>
        {article.summary && <p className="mt-2 text-muted-foreground">{article.summary}</p>}
        {article.publishedAt && (
          <p className="mt-2 text-xs text-muted-foreground">
            Published {new Date(article.publishedAt).toLocaleDateString()}
          </p>
        )}
      </div>

      {canModerate(role) && article.currentSubmission && (
        <IndexingControl submission={article.currentSubmission} />
      )}

      {article.currentSubmission ? (
        <MarkdownView content={article.currentSubmission.content} />
      ) : (
        <p className="text-sm text-muted-foreground">This article has no content yet.</p>
      )}

      {article.status === "PUBLISHED" && (
        <CommentSection parentType="article" parentId={article.id} />
      )}
    </article>
  );
}
