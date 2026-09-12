"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Asterisk, ChevronDown, Database, LayoutDashboard, Newspaper, PenSquare, ShieldCheck, Users } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@repo/ui/components/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@repo/ui/components/collapsible";
import { Button } from "@repo/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui/components/tooltip";
import { useCurrentUser } from "../../hooks/use-current-user";
import { canCreateContent, canModerate } from "../../hooks/use-role";
import { useArticleNav } from "../../hooks/use-articles";
import { useResponsiveSidebarDefault } from "../../hooks/use-responsive-sidebar-default";
import { CATEGORY_LABELS, CATEGORY_VALUES } from "../../lib/category-labels";
import { NavUser } from "./nav-user";

// Groups every published article by category ("Part") in CATEGORY_VALUES order (stable regardless
// of publish order, so groups don't jitter as new content ships), each already publishedAt-ascending
// from useArticleNav — so mapping over a group in order and numbering from 1 gives chapter numbers.
function groupByCategory(items: { category: string; slug: string; title: string }[]) {
  const groups = new Map<string, typeof items>();
  for (const item of items) {
    const list = groups.get(item.category) ?? [];
    list.push(item);
    groups.set(item.category, list);
  }
  return CATEGORY_VALUES.map((category) => ({
    category,
    articles: groups.get(category) ?? [],
  })).filter((group) => group.articles.length > 0);
}

function chapterNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

// Shared across the desktop sidebar and the small-screen top navbar (mobile-top-nav.tsx) so both
// presentations route from the same data instead of duplicating nav items.
export const NAV_LINKS = [
  { href: "/tech-reads", label: "Tech Reads", icon: Newspaper },
  { href: "/dashboard", label: "My Content", icon: LayoutDashboard },
];

export const ADMIN_LINKS = [
  { href: "/admin/review", label: "Review Queue", icon: ShieldCheck },
  { href: "/admin/users", label: "Manage Users", icon: Users },
  { href: "/admin/indexing", label: "Indexing", icon: Database },
];

interface AppSidebarProps {
  onResizeStart: React.PointerEventHandler<HTMLButtonElement>;
}

export function AppSidebar({ onResizeStart }: AppSidebarProps) {
  const pathname = usePathname();
  const { role } = useCurrentUser();
  const { data } = useArticleNav();
  useResponsiveSidebarDefault();

  const groups = groupByCategory(data?.items ?? []);
  const activeSlug = pathname.startsWith("/articles/") ? pathname.slice("/articles/".length) : null;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="shrink-0">
        <div className="flex items-center justify-between gap-2 px-2 py-1">
          <Link href="/articles" className="flex min-w-0 items-center gap-2 font-semibold">
            <Asterisk className="h-5 w-5 shrink-0" />
            <span className="truncate group-data-[collapsible=icon]:hidden">Groundwork</span>
          </Link>
          {canCreateContent(role) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild size="icon" variant="ghost" className="shrink-0">
                  <Link href="/articles/new" aria-label="New Article">
                    <PenSquare className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">New Article</TooltipContent>
            </Tooltip>
          )}
        </div>
      </SidebarHeader>

      {/* `className="contents"` (display: contents) adds the "navigation" landmark without
      changing any of SidebarContent's existing flex layout — the shared Sidebar primitive's own
      root elements don't reliably forward an aria-label/role prop across all of its render
      branches (desktop/mobile/collapsible="none"), so the landmark is added here instead. */}
      <nav aria-label="Main navigation" className="contents">
      <SidebarContent>
        {/* The per-category chapter list only reads well at full width, so it's reserved for the
        expanded (lg+) sidebar — the icon-only rail (md, or a manual collapse) falls back to just
        the routed links below, which already have icons. */}
        <div className="group-data-[collapsible=icon]:hidden">
          {groups.map(({ category, articles }) => (
            <Collapsible key={category} defaultOpen className="group/collapsible">
              <SidebarGroup>
                <CollapsibleTrigger className="group w-full text-left">
                  <SidebarGroupLabel className="cursor-pointer">
                    <span className="min-w-0 truncate">
                      {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                    </span>
                    <ChevronDown className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=closed]:-rotate-90" />
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {articles.map((article, index) => {
                        const isActive = article.slug === activeSlug;
                        return (
                          <SidebarMenuItem key={article.slug}>
                            <SidebarMenuButton asChild isActive={isActive}>
                              <Link href={`/articles/${article.slug}`}>
                                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                  {chapterNumber(index)}
                                </span>
                                <span className="min-w-0 truncate">{article.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          ))}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_LINKS.map((link) => (
                <SidebarMenuItem key={link.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(link.href)}
                    tooltip={link.label}
                  >
                    <Link href={link.href} aria-label={link.label}>
                      <link.icon className="h-4 w-4" />
                      <span>{link.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {canModerate(role) &&
                ADMIN_LINKS.map((link) => (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(link.href)}
                      tooltip={link.label}
                    >
                      <Link href={link.href} aria-label={link.label}>
                        <link.icon className="h-4 w-4" />
                        <span>{link.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      </nav>

      <SidebarFooter className="shrink-0">
        <NavUser />
      </SidebarFooter>
      <SidebarRail
        onPointerDown={onResizeStart}
        title="Drag to resize, click to toggle"
        className="cursor-col-resize"
      />
    </Sidebar>
  );
}
