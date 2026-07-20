"use client";

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
import { useDeleteArtifact } from "../../../hooks/use-artifacts";

interface DeleteArtifactDialogProps {
  projectId: string;
  artifact: { id: string; title: string } | null;
  onOpenChange: (open: boolean) => void;
}

// A confirmation dialog shown before deleting an artifact. `artifact` being null means the dialog is closed — passing an artifact object opens it.

export function DeleteArtifactDialog({
  projectId,
  artifact,
  onOpenChange,
}: DeleteArtifactDialogProps) {
  const deleteArtifact = useDeleteArtifact(projectId);

  return (
    <AlertDialog open={Boolean(artifact)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &quot;{artifact?.title}&quot;?</AlertDialogTitle>
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
              if (!artifact) return;
              // Delete, then close the dialog once it succeeds.
              deleteArtifact.mutate(artifact.id, {
                onSuccess: () => onOpenChange(false),
              });
            }}
          >
            {deleteArtifact.isPending ? "Deleting..." : "Delete artifact"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
