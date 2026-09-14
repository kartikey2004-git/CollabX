"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "sidebar_width";
const DEFAULT_WIDTH = 256; // 16rem — matches the shadcn Sidebar primitive's own default.
const MIN_WIDTH = 200;
const MAX_WIDTH = 420;

function clamp(value: number): number {
  return Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, value));
}

// The shadcn Sidebar primitive (packages/ui/src/components/sidebar.tsx) only supports a fixed
// --sidebar-width and a click-to-toggle SidebarRail — dragging the rail already shows a
// col-resize cursor in its own styling, but nothing wires up an actual drag. Rather than changing
// the shared component, this hook drives --sidebar-width from here and app-shell.tsx overrides it
// via SidebarProvider's `style` prop; app-sidebar.tsx just forwards the returned onPointerDown onto
// its existing <SidebarRail>. Width persists across reloads the same way the primitive's own
// open/collapsed state persists via a cookie, just in localStorage since this is view-only state.
export function useSidebarWidth() {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const dragState = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) setWidth(clamp(Number(stored)));
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      dragState.current = { startX: event.clientX, startWidth: width };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onPointerMove = (moveEvent: PointerEvent) => {
        if (!dragState.current) return;
        setWidth(clamp(dragState.current.startWidth + (moveEvent.clientX - dragState.current.startX)));
      };

      const onPointerUp = () => {
        dragState.current = null;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        setWidth((current) => {
          window.localStorage.setItem(STORAGE_KEY, String(current));
          return current;
        });
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [width],
  );

  return { width, onPointerDown };
}
