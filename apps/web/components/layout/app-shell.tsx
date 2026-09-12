"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/ui/components/breadcrumb";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@repo/ui/components/sidebar";
import { useSidebarWidth } from "../../hooks/use-sidebar-width";
import { AppSidebar } from "./app-sidebar";
import { ArticleToc } from "./article-toc";
import { MobileTopNav } from "./mobile-top-nav";
import { TocProvider } from "./toc-context";

interface BreadcrumbSegment {
  label: string;
  href: string;
}

// Turns the current path into a readable breadcrumb trail, e.g. /articles/foo-bar -> "Articles /
// Foo Bar", with each non-final segment linking to its own path prefix. Good enough for this app's
// shallow route tree (no nested dynamic segments beyond one level) — not meant to be a
// general-purpose router-breadcrumb utility.
function useBreadcrumbSegments(): BreadcrumbSegment[] {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  let href = "";
  return parts.map((segment) => {
    href += `/${segment}`;
    return {
      label: segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
      href,
    };
  });
}

function AppBreadcrumb() {
  const segments = useBreadcrumbSegments();

  if (segments.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => (
          <React.Fragment key={segment.href}>
            <BreadcrumbItem>
              {index === segments.length - 1 ? (
                <BreadcrumbPage>{segment.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={segment.href}>{segment.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < segments.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { width, onPointerDown } = useSidebarWidth();

  return (
    <SidebarProvider style={{ "--sidebar-width": `${width}px` } as React.CSSProperties}>
      <TocProvider>
        <AppSidebar onResizeStart={onPointerDown} />
        <SidebarInset>
          <MobileTopNav />
          <header className="sticky top-0 z-10 hidden h-14 items-center gap-2 border-b border-border bg-background px-4 md:flex md:pl-16 md:pr-6">
            <SidebarTrigger />
            <AppBreadcrumb />
          </header>
          <div className="grid flex-1 grid-cols-1 gap-8 px-4 py-8 md:pl-16 md:pr-8 xl:grid-cols-[minmax(0,1fr)_14rem]">
            <main className="max-w-5xl">{children}</main>
            <ArticleToc />
          </div>
        </SidebarInset>
      </TocProvider>
    </SidebarProvider>
  );
}
