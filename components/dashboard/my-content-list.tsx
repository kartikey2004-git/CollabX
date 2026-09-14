"use client";

import { useState } from "react";
import { Inbox } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ContentStatusInput } from "@/lib/validation";
import { useMyArticles } from "../../hooks/use-articles";
import { useMyTechReads } from "../../hooks/use-tech-reads";
import { EmptyState } from "../shared/empty-state";
import { MyContentRow } from "./my-content-row";

const ALL_STATUS = "ALL" as const;
const STATUS_OPTIONS: Array<ContentStatusInput | typeof ALL_STATUS> = [
  ALL_STATUS,
  "DRAFT",
  "PENDING_REVIEW",
  "PUBLISHED",
  "REJECTED",
];

function statusLabel(status: ContentStatusInput | typeof ALL_STATUS): string {
  return status === ALL_STATUS ? "All statuses" : status.replace("_", " ");
}

// GET /articles/mine and /tech-reads/mine — a CONTRIBUTOR sees their own content, an ADMIN sees
// everything platform-wide (see docs/changes/004-backend-changes.md); this page doesn't need to
// know which mode applies, the backend decides it from the caller's role.

export function MyContentList() {
  const [status, setStatus] = useState<ContentStatusInput | typeof ALL_STATUS>(ALL_STATUS);

  const filters = status === ALL_STATUS ? {} : { status };
  const articles = useMyArticles(filters);
  const techReads = useMyTechReads(filters);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Content</h1>
          <p className="text-sm text-muted-foreground">
            Everything you&apos;ve created, across every status.
          </p>
        </div>
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as ContentStatusInput | typeof ALL_STATUS)}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {statusLabel(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="articles">
        <TabsList>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="tech-reads">Tech Reads</TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="mt-4">
          {articles.isPending && (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          )}
          {articles.isError && (
            <p className="text-sm text-destructive">Failed to load your articles</p>
          )}
          {!articles.isPending && !articles.isError && articles.data?.items.length === 0 && (
            <EmptyState
              icon={Inbox}
              title="No articles yet"
              description="Create your first article to see it here."
            />
          )}
          {!articles.isPending && !articles.isError && articles.data && articles.data.items.length > 0 && (
            <ul className="space-y-3">
              {articles.data.items.map((article) => (
                <MyContentRow key={article.id} parentType="article" item={article} />
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="tech-reads" className="mt-4">
          {techReads.isPending && (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          )}
          {techReads.isError && (
            <p className="text-sm text-destructive">Failed to load your tech reads</p>
          )}
          {!techReads.isPending && !techReads.isError && techReads.data?.items.length === 0 && (
            <EmptyState
              icon={Inbox}
              title="No tech reads yet"
              description="Curate your first tech read to see it here."
            />
          )}
          {!techReads.isPending && !techReads.isError && techReads.data && techReads.data.items.length > 0 && (
            <ul className="space-y-3">
              {techReads.data.items.map((techRead) => (
                <MyContentRow key={techRead.id} parentType="techRead" item={techRead} />
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
