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
import { useDeleteWorkspace } from "../../../hooks/use-workspaces";

interface DeleteWorkspaceDialogProps {
  workspace: { id: string; name: string } | null;
  onOpenChange: (open: boolean) => void;
}

// A confirmation dialog shown before deleting a workspace. `workspace` being null means the dialog is closed — passing a workspace object opens it.

export function DeleteWorkspaceDialog({
  workspace,
  onOpenChange,
}: DeleteWorkspaceDialogProps) {
  const deleteWorkspace = useDeleteWorkspace();

  return (
    <AlertDialog open={Boolean(workspace)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &quot;{workspace?.name}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the workspace and every project and
            artifact inside it. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteWorkspace.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteWorkspace.isPending}
            onClick={() => {
              if (!workspace) return;
              // Delete, then close the dialog once it succeeds.
              deleteWorkspace.mutate(workspace.id, {
                onSuccess: () => onOpenChange(false),
              });
            }}
          >
            {deleteWorkspace.isPending ? "Deleting..." : "Delete workspace"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
