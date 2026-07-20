"use client";

import Image from "next/image";
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  useSidebar,
} from "@repo/ui/components/sidebar";
import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";

// The main app sidebar which contain logo/header, navigation links, and the user menu at
// the bottom. Shows a compact icon-only layout when collapsed.

export function AppSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center justify-center rounded-lg px-2 py-1.5">
          {/* Icon-only logo when collapsed, full logo + name when expanded. */}
          {isCollapsed ? (
            <Image
              src="/logo.svg"
              alt="CollabX"
              width={24}
              height={24}
              className="h-6 w-6"
            />
          ) : (
            <div className="flex items-center gap-2 rounded-lg  w-full px-2 py-1.5">
              <Image
                src="/logo.svg"
                alt="CollabX"
                width={20}
                height={20}
                className="h-5 w-5"
              />
              <span className="text-sm font-semibold">
                CollabX
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain />
      </SidebarContent>

      <SidebarFooter>
        {!isCollapsed && (
          <div className="border-t bg-sidebar-accent/30 p-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h4 className="text-sm font-semibold">CollabX</h4>
                <p className="text-muted-foreground text-xs">
                  Workspace for developers.
                </p>
              </div>

              <NavUser size="sm" />
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="flex justify-center">
            <NavUser size="sm" />
          </div>
        )}
      </SidebarFooter>
    </>
  );
}