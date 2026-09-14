"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { HeadingItem } from "../../lib/markdown-headings";
import { useToc } from "./toc-context";

interface TocSection {
  heading: HeadingItem;
  children: HeadingItem[];
}

// Buckets the flat h2/h3 list into h2 "sections" with their trailing h3s as children — an h3 ahead
// of any h2 (rare, but a heading-less article could reasonably start at h3) becomes its own
// childless section rather than being dropped.
function groupSections(headings: HeadingItem[]): TocSection[] {
  const sections: TocSection[] = [];
  for (const heading of headings) {
    const current = sections[sections.length - 1];
    if (heading.depth === 2 || !current) {
      sections.push({ heading, children: [] });
    } else {
      current.children.push(heading);
    }
  }
  return sections;
}

// Renders the active article's headings as a sticky "On this page" rail to the right of the
// content (see app-shell.tsx), mirroring elements.ai-sdk.dev's component pages. Reads from the
// same TocContext article-detail.tsx populates — returns null on any route that never calls
// setHeadings, so it only ever appears alongside actual article content.
export function ArticleToc() {
  const { headings, activeId } = useToc();
  const activeLinkRef = useRef<HTMLAnchorElement | null>(null);
  const sections = useMemo(() => groupSections(headings), [headings]);

  // Keeps the active link in view within the rail's own scroll container (it only scrolls
  // internally once headings overflow max-h) without ever touching the page's own scroll —
  // "nearest" is a no-op when the link is already visible.
  useEffect(() => {
    activeLinkRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeId]);

  if (headings.length === 0) return null;

  return (
    <aside className="hidden xl:block">
      <nav className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          On this page
        </p>
        {/* Keyed by this article's own heading set so navigating to a different article remounts
            the list outright instead of letting the layoutId indicator slide across two unrelated
            articles' headings — it should only ever animate between sections of the same article. */}
        <ul key={headings.map((h) => h.id).join("|")} className="mt-3 space-y-1 border-l border-border text-sm">
          {sections.map((section) => {
            const isHeadingActive = section.heading.id === activeId;
            const isSectionActive =
              isHeadingActive || section.children.some((child) => child.id === activeId);

            return (
              <li key={section.heading.id} className="relative">
                {isHeadingActive && (
                  <motion.span
                    layoutId="toc-active-indicator"
                    aria-hidden
                    className="absolute inset-y-0 -left-1.5 w-0.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 40, mass: 0.5 }}
                  />
                )}
                <a
                  ref={isHeadingActive ? activeLinkRef : undefined}
                  href={`#${section.heading.id}`}
                  className={cn(
                    "block py-1 pl-3 transition-colors duration-200 ease-out",
                    isHeadingActive
                      ? "font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {section.heading.text}
                </a>

                {isSectionActive && section.children.length > 0 && (
                  <ul className="ml-3 mt-1 space-y-1 py-1 pl-3">
                    {section.children.map((child) => {
                      const isChildActive = child.id === activeId;
                      return (
                        <li key={child.id}>
                          <a
                            ref={isChildActive ? activeLinkRef : undefined}
                            href={`#${child.id}`}
                            className={cn(
                              "block truncate rounded-md px-2 py-1 text-xs transition-colors duration-200 ease-out",
                              isChildActive
                                ? "font-medium text-foreground"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {child.text}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
