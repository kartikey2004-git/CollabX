"use client";

import { useEffect } from "react";
import { WorkspaceHeader } from "../../components/workspace/shared/workspace-header";
import { Button } from "@repo/ui/components/button";
import { AlertCircle } from "lucide-react";

// Next.js automatically shows this if anything throws while rendering the /workspace route, instead of crashing the whole app. `reset` retries rendering.

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Log the error for debugging whenever a new one comes in.
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <WorkspaceHeader />
      <main className="flex flex-1 items-center justify-center bg-background">
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
          </div>
          <h2 className="mb-2 text-xl font-semibold">Something went wrong</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            An error occurred while loading your workspace. Please try again.
          </p>
          <Button onClick={reset} variant="outline">
            Try again
          </Button>
        </div>
      </main>
    </>
  );
}
