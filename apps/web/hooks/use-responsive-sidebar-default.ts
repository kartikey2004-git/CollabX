"use client";

import { useEffect, useRef } from "react";
import { useSidebar } from "@repo/ui/components/sidebar";

const MD_ONLY_QUERY = "(min-width: 768px) and (max-width: 1023px)";
const LG_UP_QUERY = "(min-width: 1024px)";

type Band = "sm" | "md" | "lg";

// Defaults the shared Sidebar (collapsible="icon") to icon-only the moment the viewport enters the
// md-only band, and back to fully expanded at lg+ — matching the breakpoint spec (lg+: labels, md:
// icon rail, <md: the separate MobileTopNav takes over instead). Only fires on a band *crossing*, so
// a user who manually re-expands/collapses via the existing SidebarTrigger/SidebarRail afterward
// isn't fought on every unrelated resize (e.g. browser chrome changes) within the same band.
export function useResponsiveSidebarDefault() {
  const { setOpen } = useSidebar();
  const lastBand = useRef<Band | null>(null);

  useEffect(() => {
    const mdMql = window.matchMedia(MD_ONLY_QUERY);
    const lgMql = window.matchMedia(LG_UP_QUERY);

    const evaluate = () => {
      const band: Band = lgMql.matches ? "lg" : mdMql.matches ? "md" : "sm";
      if (band === lastBand.current) return;
      lastBand.current = band;
      if (band === "md") setOpen(false);
      if (band === "lg") setOpen(true);
    };

    evaluate();
    mdMql.addEventListener("change", evaluate);
    lgMql.addEventListener("change", evaluate);
    return () => {
      mdMql.removeEventListener("change", evaluate);
      lgMql.removeEventListener("change", evaluate);
    };
  }, [setOpen]);
}
