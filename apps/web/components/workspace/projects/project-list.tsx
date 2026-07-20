"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileStack, Plus, Trash2 } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useProjects } from "../../../hooks/use-projects";
import {
  canManageProjectsAndArtifacts,
  useWorkspaceRole,
} from "../../../hooks/use-workspace-role";
import { EmptyState } from "../shared/empty-states";
import { CreateProjectDialog } from "./create-project-dialog";
import { DeleteProjectDialog } from "./delete-project-dialog";

// A workspace's grid of project cards, with loading/error/empty states, a "New Project" button, and per-card delete for users who can manage projects.

export function ProjectList({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const { data, isPending, isError, error } = useProjects(workspaceId);
  const role = useWorkspaceRole(workspaceId);
  const canManage = canManageProjectsAndArtifacts(role);
  const [createOpen, setCreateOpen] = useState(false);
  
  // The project currently targeted for deletion (opens the confirm dialog when set).
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Projects</h2>
          <p className="text-sm text-muted-foreground">
            Group related artifacts together.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setCreateOpen(true)} className="rounded-sm bg-black text-white hover:bg-slate-800">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        )}
      </div>

      {/* Skeleton placeholders while the project list is loading. */}
      {isPending && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : "Failed to load projects"}
        </div>
      )}

      {/* No projects yet — show a call-to-action instead of an empty grid. */}
      {!isPending && !isError && data?.items.length === 0 && (
        <EmptyState
          icon={FileStack}
          title="No projects yet"
          description={
            canManage
              ? "Create a project to start adding docs, diagrams, and schemas."
              : "No projects have been created in this workspace yet."
          }
          action={
            canManage ? (
              <Button onClick={() => setCreateOpen(true)} className="rounded-sm bg-black text-white hover:bg-slate-800">
                Create project
              </Button>
            ) : undefined
          }
        />
      )}

      {/* The actual grid of project cards — clicking one navigates into it. */}
      {!isPending && !isError && data && data.items.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((project) => (
            <Card
              key={project.id}
              className="cursor-pointer transition-colors hover:border-foreground/30 rounded-sm"
              onClick={() =>
                router.push(`/workspace/${workspaceId}/${project.id}`)
              }
            >
              <CardHeader>
                <CardTitle className="truncate">{project.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {project.description || "No description"}
                </CardDescription>
              </CardHeader>
              {canManage && (
                <CardContent className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={(e) => {
                      
                      // Stop the click from bubbling up to the card, which would otherwise also navigate into the project.
                      e.stopPropagation();
                      setDeleteTarget({ id: project.id, name: project.name });
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

      <CreateProjectDialog
        workspaceId={workspaceId}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <DeleteProjectDialog
        workspaceId={workspaceId}
        project={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
