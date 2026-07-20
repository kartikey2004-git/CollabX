"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, Plus } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { Badge } from "@repo/ui/components/badge";
import { useWorkspaces } from "../../../hooks/use-workspaces";
import { canManageWorkspace } from "../../../hooks/use-workspace-role";
import { EmptyState } from "../shared/empty-states";
import { CreateWorkspaceDialog } from "./create-workspace-dialog";
import { DeleteWorkspaceDialog } from "./delete-workspace-dialog";
import { Trash2 } from "lucide-react";

// The main /workspace page's grid of workspace cards, with loading/error/empty states, a "New Workspace" button, and per-card delete for admins.
  
export function WorkspaceList() {
  const router = useRouter();
  const { data, isPending, isError, error } = useWorkspaces();
  const [createOpen, setCreateOpen] = useState(false);
  
  // The workspace currently targeted for deletion (opens the confirm dialog when set).
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl tracking-tight text-muted-foreground">
            Your Workspaces
          </h1>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="rounded-sm bg-black text-white hover:bg-slate-800">
          <Plus className="h-4 w-4" />
          New Workspace
        </Button>
      </div>

      {/* Skeleton placeholders while the workspace list is loading. */}
      {isPending && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error instanceof Error
            ? error.message
            : "Failed to load workspaces"}
        </div>
      )}

      {/* No workspaces yet — show a call-to-action instead of an empty grid. */}
      {!isPending && !isError && data?.items.length === 0 && (
        <EmptyState
          icon={FolderKanban}
          title="No workspaces yet"
          description="Create a workspace to start organizing projects and documentation."
          action={
            <Button onClick={() => setCreateOpen(true)} className="rounded-sm bg-black text-white hover:bg-slate-800">
              Create workspace
            </Button>
          }
        />
      )}

      {/* The actual grid of workspace cards — clicking one navigates into it. */}
      {!isPending && !isError && data && data.items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((workspace) => (
            <Card
              key={workspace.id}
              className="cursor-pointer transition-colors rounded-sm hover:border-foreground/30"
              onClick={() => router.push(`/workspace/${workspace.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2 -mb-1">
                  <CardTitle className="truncate">{workspace.name}</CardTitle>
                  <Badge variant="secondary">{workspace.role}</Badge>
                </div>
                <CardDescription>
                  Created {new Date(workspace.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              {canManageWorkspace(workspace.role) && (
                <CardContent className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      
                      // Stop the click from bubbling up to the card, which would otherwise also navigate into the workspace.
                      e.stopPropagation();
                      setDeleteTarget({
                        id: workspace.id,
                        name: workspace.name,
                      });
                    }}
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
      <DeleteWorkspaceDialog
        workspace={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
