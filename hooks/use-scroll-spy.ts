"use client";

import { useEffect, useState } from "react";

// Tracks which of the given heading ids is currently "in view," biased toward the topmost heading
// once it crosses into the upper part of the viewport — this is what lets ArticleDetail highlight
// the right TOC sub-item in the sidebar as the reader scrolls. Standalone/context-free on purpose:
// the caller (ArticleDetail) is what pushes the result into TocContext, so this hook stays testable
// and reusable on its own.

export function useScrollSpy(headingIds: string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headingIds.length === 0) {
      setActiveId(null);
      return;
    }

    const elements = headingIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;

        // Among currently-visible headings, the one closest to the top of the viewport is "active."
        const topmost = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b,
        );
        setActiveId(topmost.target.id);
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    setActiveId(elements[0]!.id);

    return () => observer.disconnect();
    // headingIds is a new array reference every render; re-running only when its actual contents
    // change (not its reference) avoids tearing down/rebuilding the observer on every re-render.
  }, [headingIds.join("|")]);

  return activeId;
}
