"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { authClient } from "@repo/auth";
import { WorkspaceHeader } from "../../components/workspace/workspace-header";

export default function WorkspacePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [isPending, session, router]);

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

  if (!session) {
    return null;
  }

  const { user } = session;

  return (
    <>
      <WorkspaceHeader />
      <main className="flex flex-1 flex-col gap-6 bg-background p-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Welcome, {user.name || "User"}!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Build documentation, diagrams, and project knowledge in one place.
            Start by exploring the workspace.
          </p>
        </div>
      </main>
    </>
  );
}
