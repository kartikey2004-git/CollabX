"use client";

import { useEffect, useRef } from "react";

// Calls `fetchNextPage` once the returned ref's element scrolls into view — replaces a manual
// "Load more" button with automatic scroll-triggered pagination for a `useInfiniteQuery` list.
// Same observer-setup/cleanup idiom as `use-scroll-spy.ts`. `rootMargin` fires the fetch a bit
// before the sentinel is actually on-screen, so the next page is usually ready by the time the
// reader reaches the bottom rather than after.
export function useInfiniteScrollTrigger(
  hasNextPage: boolean | undefined,
  isFetchingNextPage: boolean,
  fetchNextPage: () => void,
) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return sentinelRef;
}
