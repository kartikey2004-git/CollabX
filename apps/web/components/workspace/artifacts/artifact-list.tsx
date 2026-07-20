"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, FileText, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Badge } from "@repo/ui/components/badge";
import { Skeleton } from "@repo/ui/components/skeleton";
import type { Artifact } from "@repo/database";
import type { ArtifactTypeInput } from "@repo/validation";
import { useArtifacts, useUpdateArtifact } from "../../../hooks/use-artifacts";
import {
  canManageProjectsAndArtifacts,
  useWorkspaceRole,
} from "../../../hooks/use-workspace-role";
import { EmptyState } from "../shared/empty-states";
import { CreateArtifactModal } from "./create-artifact-modal";
import { DeleteArtifactDialog } from "./delete-artifact-dialog";
import { ArtifactTypeIcon } from "./artifact-type-icon";

interface ArtifactListProps {
  workspaceId: string;
  projectId: string;
  activeType: ArtifactTypeInput | null;
}

// A project's list of artifacts, with loading/error/empty states, a "New Artifact" button, and per-row inline rename + delete for managers.

export function ArtifactList({
  workspaceId,
  projectId,
  activeType,
}: ArtifactListProps) {
  const router = useRouter();
  const { data, isPending, isError, error } = useArtifacts(
    projectId,
    activeType ?? undefined,
  );
  const role = useWorkspaceRole(workspaceId);
  const canManage = canManageProjectsAndArtifacts(role);
  const updateArtifact = useUpdateArtifact(projectId);

  const [createOpen, setCreateOpen] = useState(false);
  
  // The artifact currently targeted for deletion (opens the confirm dialog when set).
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Which artifact (if any) is currently being renamed inline, and its draft value.
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Switches one row's title into an editable input, pre-filled with the current title.
  const startRename = (artifact: Artifact) => {
    setRenamingId(artifact.id);
    setRenameValue(artifact.title);
  };

  // Saves the new title (if non-empty) and exits rename mode either way.
  const commitRename = () => {
    if (!renamingId) return;
    const title = renameValue.trim();
    if (title.length < 1) {
      setRenamingId(null);
      return;
    }
    updateArtifact.mutate(
      { artifactId: renamingId, input: { title } },
      { onSettled: () => setRenamingId(null) },
    );
  };

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Artifacts</h2>
          <p className="text-sm text-muted-foreground">
            Documents, diagrams, and schemas in this project.
          </p>
        </div>
        {canManage && (
          <Button onClick={() => setCreateOpen(true)} className="rounded-sm bg-black text-white hover:bg-slate-800">
            <Plus className="h-4 w-4" />
            New Artifact
          </Button>
        )}
      </div>

      {/* Skeleton placeholders while the artifact list is loading. */}
      {isPending && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error instanceof Error
            ? error.message
            : "Failed to load artifacts"}
        </div>
      )}

      {/* No artifacts yet — show a call-to-action instead of an empty list. */}
      {!isPending && !isError && data?.items.length === 0 && (
        <EmptyState
          icon={FileText}
          title="No artifacts yet"
          description={
            canManage
              ? "Create your first document, diagram, or schema."
              : "No artifacts have been created here yet."
          }
          action={
            canManage ? (
              <Button onClick={() => setCreateOpen(true)} className="rounded-sm bg-black text-white hover:bg-slate-800">
                Create artifact
              </Button>
            ) : undefined
          }
        />
      )}

      {/* The actual artifact rows — clicking one navigates to its detail page,
          unless it's currently being renamed inline. */}

      {!isPending && !isError && data && data.items.length > 0 && (
        <ul className="divide-y divide-gray-200 rounded-sm border border-gray-200">
          {data.items.map((artifact) => {
            const isRenaming = renamingId === artifact.id;
            return (
              <li
                key={artifact.id}
                onClick={() => {
                  if (!isRenaming) {
                    router.push(
                      `/workspace/${workspaceId}/${projectId}/${artifact.id}`,
                    );
                  }
                }}
                className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-gray-100"
              >
                <ArtifactTypeIcon type={artifact.type as ArtifactTypeInput} />
                {isRenaming ? (
                  <div
                    className="flex flex-1 items-center gap-2"
                    // Stop clicks inside the rename input from also triggering row navigation.
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename();
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      autoFocus
                      className="h-8"
                    />
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={commitRename}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => setRenamingId(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <span className="flex-1 truncate text-sm font-medium text-gray-900">
                    {artifact.title}
                  </span>
                )}
                <Badge variant="outline" className="shrink-0">
                  {artifact.type}
                </Badge>
                <span className="shrink-0 text-xs text-gray-500">
                  {new Date(artifact.updatedAt).toLocaleDateString()}
                </span>
                {canManage && !isRenaming && (
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={(e) => {
                        // Stop the click from bubbling up to the row, which
                        // would otherwise also navigate to the artifact.
                        e.stopPropagation();
                        startRename(artifact);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget({
                          id: artifact.id,
                          title: artifact.title,
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <CreateArtifactModal
        projectId={projectId}
        defaultType={activeType ?? undefined}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
      <DeleteArtifactDialog
        projectId={projectId}
        artifact={deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
