"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { authClient } from "@repo/auth";
import { Sidebar, SidebarInset } from "@repo/ui/components/sidebar";
import { AppSidebar } from "../../components/workspace/shared/app-sidebar";
import { WorkspaceHeader } from "../../components/workspace/shared/workspace-header";
import { WorkspaceList } from "../../components/workspace/workspaces/workspace-list";

// The main /workspace page shows a welcome message and the list of workspaces the logged-in user belongs to. Redirects to /login if not authenticated.

export default function WorkspacePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  // Once we know for sure there's no session, send the user to the login page.
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [isPending, session, router]);

  // While we're still checking whether the user is logged in, show a spinner.
  if (isPending) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-border border-t-black" />
          <p className="text-sm text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // No session means we're mid-redirect to /login — render nothing in the meantime.
  if (!session) {
    return null;
  }

  const { user } = session;

  return (
    <>
      <Sidebar collapsible="icon">
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <WorkspaceHeader />
        <main className="flex flex-1 flex-col gap-6 bg-background p-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Welcome, {user.name || "User"}!
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Build documentation, diagrams, and project knowledge in one
              place. Start by exploring the workspace.
            </p>
          </div>
          <WorkspaceList />
        </main>
      </SidebarInset>
    </>
  );
}
