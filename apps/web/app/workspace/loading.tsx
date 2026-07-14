import { WorkspaceHeader } from "../../components/workspace/workspace-header";
import { Skeleton } from "@repo/ui/components/skeleton";

export default function WorkspaceLoading() {
  return (
    <>
      <WorkspaceHeader />
      <main className="flex flex-1 flex-col gap-6 bg-background p-6">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-6">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="mt-4 h-12 w-full" />
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
