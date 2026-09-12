"use client";

import { createContext, useContext, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import type { HeadingItem } from "../../lib/markdown-headings";

// Bridges an article page's parsed headings/scroll position into the sidebar (app-sidebar.tsx),
// which renders them as nested TOC items under the active chapter. Lives above the whole (app)
// shell (see app-shell.tsx) so it's always present — on non-article routes (dashboard, tech-reads,
// admin) nothing ever calls setHeadings, so `headings` just stays empty and the sidebar renders no
// extra TOC nodes.

interface TocContextValue {
  headings: HeadingItem[];
  activeId: string | null;
  setHeadings: Dispatch<SetStateAction<HeadingItem[]>>;
  setActiveId: Dispatch<SetStateAction<string | null>>;
}

const TocContext = createContext<TocContextValue | null>(null);

export function TocProvider({ children }: { children: React.ReactNode }) {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const value = useMemo(
    () => ({ headings, activeId, setHeadings, setActiveId }),
    [headings, activeId],
  );

  return <TocContext.Provider value={value}>{children}</TocContext.Provider>;
}

export function useToc(): TocContextValue {
  const ctx = useContext(TocContext);
  if (!ctx) throw new Error("useToc must be used within a TocProvider");
  return ctx;
}
