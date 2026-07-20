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
import { useDeleteProject } from "../../../hooks/use-projects";

interface DeleteProjectDialogProps {
  workspaceId: string;
  project: { id: string; name: string } | null;
  onOpenChange: (open: boolean) => void;
}

// A confirmation dialog shown before deleting a project. `project` being null means the dialog is closed — passing a project object opens it.

export function DeleteProjectDialog({
  workspaceId,
  project,
  onOpenChange,
}: DeleteProjectDialogProps) {
  const deleteProject = useDeleteProject(workspaceId);

  return (
    <AlertDialog open={Boolean(project)} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete &quot;{project?.name}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            This deletes the project and every artifact inside it. Deleted
            projects can be recovered by an administrator; this is not
            immediate or automatic.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteProject.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteProject.isPending}
            onClick={() => {
              if (!project) return;
              // Delete, then close the dialog once it succeeds.
              deleteProject.mutate(project.id, {
                onSuccess: () => onOpenChange(false),
              });
            }}
          >
            {deleteProject.isPending ? "Deleting..." : "Delete project"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
