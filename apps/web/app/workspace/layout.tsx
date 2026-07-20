import { SidebarProvider } from "@repo/ui/components/sidebar";
import { QueryProvider } from "../../lib/query-client";
import { Toaster } from "@repo/ui/components/sonner";

// The top-level layout for everything under /workspace. Wraps all child pages with the data-fetching provider, the sidebar's open/closed state, and toast notifications.

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      <SidebarProvider defaultOpen={true}>
        {children}
        <Toaster richColors />
      </SidebarProvider>
    </QueryProvider>
  );
}
