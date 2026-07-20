"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Badge } from "@repo/ui/components/badge";
import { Skeleton } from "@repo/ui/components/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/alert-dialog";
import type { ArtifactTypeInput } from "@repo/validation";
import {
  useArtifact,
  useDeleteArtifact,
  useUpdateArtifact,
} from "../../../../../hooks/use-artifacts";
import {
  canManageProjectsAndArtifacts,
  useWorkspaceRole,
} from "../../../../../hooks/use-workspace-role";
import {
  ARTIFACT_TYPE_LABEL,
  ArtifactTypeIcon,
} from "../../../../../components/workspace/artifacts/artifact-type-icon";

// Shows a single artifact's details (/workspace/:workspaceId/:projectId/:artifactId), with inline rename and a delete confirmation dialog for users who can manage it.

export default function ArtifactDetailPage() {
  const params = useParams<{
    workspaceId: string;
    projectId: string;
    artifactId: string;
  }>();
  const router = useRouter();
  const { workspaceId, projectId, artifactId } = params;

  // Fetch this artifact's data + mutation helpers for updating/deleting it.
  const {
    data: artifact,
    isPending,
    isError,
    error,
  } = useArtifact(artifactId);

  const role = useWorkspaceRole(workspaceId);
  const canManage = canManageProjectsAndArtifacts(role);
  const updateArtifact = useUpdateArtifact(projectId);
  const deleteArtifact = useDeleteArtifact(projectId);

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Switches the title into an editable input, pre-filled with the current title.
  const startRename = () => {
    if (!artifact) return;
    setRenameValue(artifact.title);
    setIsRenaming(true);
  };

  // Saves the new title (if non-empty) and exits rename mode either way.
  const commitRename = () => {
    const title = renameValue.trim();
    if (title.length < 1) {
      setIsRenaming(false);
      return;
    }
    updateArtifact.mutate(
      { artifactId, input: { title } },
      { onSettled: () => setIsRenaming(false) },
    );
  };

  // While the artifact is still loading, show a skeleton placeholder.
  if (isPending) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
    );
  }

  // If the fetch failed or the artifact doesn't exist, show an error message instead.
  if (isError || !artifact) {
    return (
      <div className="p-6 text-sm text-gray-500">
        {error instanceof Error ? error.message : "Artifact not found."}
      </div>
    );
  }

  const type = artifact.type as ArtifactTypeInput;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <ArtifactTypeIcon type={type} className="h-6 w-6 text-gray-700" />
          {isRenaming ? (
            <div className="flex items-center gap-2">
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") setIsRenaming(false);
                }}
                autoFocus
                className="h-9 w-64"
              />
              <Button size="icon-sm" variant="ghost" onClick={commitRename}>
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => setIsRenaming(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <h1 className="truncate text-2xl font-semibold tracking-tight text-gray-900">
              {artifact.title}
            </h1>
          )}
        </div>

        {canManage && !isRenaming && (
          <div className="flex shrink-0 items-center gap-1">
            <Button size="icon-sm" variant="ghost" onClick={startRename}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 text-sm text-gray-500">
        <Badge variant="outline">{ARTIFACT_TYPE_LABEL[type]}</Badge>
        <span>Updated {new Date(artifact.updatedAt).toLocaleDateString()}</span>
      </div>

      <div className="rounded-lg border border-gray-200 p-8 text-sm text-gray-400">
        Document preview isn&apos;t available yet for this artifact type.
      </div>

      {/* Confirmation dialog shown before actually deleting the artifact. */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &quot;{artifact.title}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone from this screen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteArtifact.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleteArtifact.isPending}
              onClick={() => {
                deleteArtifact.mutate(artifact.id, {
                  onSuccess: () =>
                    router.push(`/workspace/${workspaceId}/${projectId}`),
                });
              }}
            >
              {deleteArtifact.isPending ? "Deleting..." : "Delete artifact"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
