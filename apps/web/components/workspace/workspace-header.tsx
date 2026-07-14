"use client";

import { SidebarTrigger } from "@repo/ui/components/sidebar";
import { Separator } from "@repo/ui/components/separator";

export function WorkspaceHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mx-2 h-4" />
      <div className="flex flex-1 items-center justify-between">
        <h1 className="text-sm font-semibold">CollabX Workspace</h1>
      </div>
    </header>
  );
}