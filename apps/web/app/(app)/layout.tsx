import { QueryProvider } from "../../lib/query-client";
import { Toaster } from "@repo/ui/components/sonner";
import { AppShell } from "../../components/layout/app-shell";

// The shared shell for every authenticated route (/articles, /tech-reads, /dashboard, /admin).
// Wraps all child pages with the data-fetching provider and toast notifications, plus the
// docs-style sidebar shell (see components/layout/app-shell.tsx) replacing the old flat top nav
// (components/layout/site-header.tsx, now retired).

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AppShell>{children}</AppShell>
      <Toaster richColors />
    </QueryProvider>
  );
}
