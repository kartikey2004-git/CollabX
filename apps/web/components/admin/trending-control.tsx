"use client";

import { useState } from "react";
import type { TechRead } from "@repo/database";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { useUpdateTechReadTrending } from "../../hooks/use-tech-reads";

// The ADMIN-only "toggle trending" control referenced by docs/changes/004-backend-changes.md
// (PATCH /tech-reads/:id/trending) — deliberately the only direct-mutation endpoint on
// Article/TechRead's own row, restricted to just these two fields so it can't be used to bypass the
// Submission review flow for title/status/content. Rendered inline on the TechRead detail page,
// gated by canModerate(role) at the call site (components/content/tech-read-detail.tsx).

export function TrendingControl({ techRead }: { techRead: TechRead }) {
  const [score, setScore] = useState(techRead.trendingScore);
  const updateTrending = useUpdateTechReadTrending();

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border p-3 text-sm">
      <span className="font-medium text-muted-foreground">Admin: Trending</span>
      <Button
        size="sm"
        variant={techRead.isTrending ? "default" : "outline"}
        onClick={() =>
          updateTrending.mutate({
            id: techRead.id,
            input: { isTrending: !techRead.isTrending },
          })
        }
        disabled={updateTrending.isPending}
      >
        {techRead.isTrending ? "Trending: On" : "Trending: Off"}
      </Button>
      <Input
        type="number"
        min={0}
        max={1_000_000}
        value={score}
        onChange={(e) => setScore(Number(e.target.value))}
        className="w-24"
        disabled={updateTrending.isPending}
      />
      <Button
        size="sm"
        variant="outline"
        onClick={() => updateTrending.mutate({ id: techRead.id, input: { trendingScore: score } })}
        disabled={updateTrending.isPending}
      >
        Save score
      </Button>
    </div>
  );
}
