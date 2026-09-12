"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import { useArticleNav } from "../../hooks/use-articles";

const MAX_RESULTS = 6;

// A lightweight article-title search, client-side over the same catalog the sidebar's chapter list
// already fetches (useArticleNav) — there's no dedicated search endpoint/UI anywhere else in the
// app to reuse or redesign, so this is scoped to just the mobile navbar's search slot.
export function NavSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { data } = useArticleNav();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return (data?.items ?? []).filter((item) => item.title.toLowerCase().includes(q)).slice(0, MAX_RESULTS);
  }, [data, query]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0" aria-label="Search articles">
          <Search className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-2">
        <Input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles..."
          aria-label="Search articles"
        />
        {results.length > 0 && (
          <ul className="mt-2 space-y-0.5">
            {results.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/articles/${item.slug}`}
                  className="block truncate rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                  onClick={() => setOpen(false)}
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
        {query.trim() && results.length === 0 && (
          <p className="mt-2 px-2 py-1.5 text-sm text-muted-foreground">No articles found.</p>
        )}
      </PopoverContent>
    </Popover>
  );
}
