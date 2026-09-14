"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Asterisk } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "../../hooks/use-current-user";
import { canModerate } from "../../hooks/use-role";
import { ADMIN_LINKS, NAV_LINKS } from "./app-sidebar";
import { NavSearch } from "./nav-search";

// The small-screen replacement for the vertical sidebar: one sticky horizontal bar (logo left, nav
// icons middle, search right) instead of a hamburger/drawer, reusing the exact same NAV_LINKS /
// ADMIN_LINKS the desktop sidebar routes from — see app-sidebar.tsx for the shared source of truth.
// Only rendered below `md` (app-shell.tsx hides the desktop header at that width instead).
export function MobileTopNav() {
  const pathname = usePathname();
  const { role } = useCurrentUser();
  const links = canModerate(role) ? [...NAV_LINKS, ...ADMIN_LINKS] : NAV_LINKS;

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-1 border-b border-border bg-background px-2 md:hidden">
      <Link
        href="/articles"
        aria-label="CollabX home"
        className="flex shrink-0 items-center gap-1.5 px-1 font-semibold"
      >
        <Asterisk className="h-5 w-5 shrink-0" />
        <span className="hidden min-[420px]:inline">CollabX</span>
      </Link>

      <nav aria-label="Main navigation" className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
        {links.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-label={link.label}
              aria-current={isActive ? "page" : undefined}
              title={link.label}
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive && "bg-accent font-medium text-foreground",
              )}
            >
              <link.icon className="h-5 w-5" />
            </Link>
          );
        })}
      </nav>

      <NavSearch />
    </header>
  );
}
