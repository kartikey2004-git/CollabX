"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Workspace, WorkspaceRole } from "@repo/database";
import type { CreateWorkspaceInput } from "@repo/validation";
import { apiClient, ApiError, ListResult } from "../lib/api-client";

// A workspace + the current user's role in it (e.g. ADMIN, EDITOR, VIEWER) — the API attaches this so the UI knows what actions to allow.
export interface WorkspaceWithRole extends Workspace {
  role: WorkspaceRole;
}

// The cache key for "the list of workspaces the current user belongs to".
export const workspacesQueryKey = ["workspaces"] as const;

// A readable message to show the user: our API's own error message if we have one, otherwise a generic fallback string.
function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

// Fetches the workspaces the logged-in user is a member of.
export function useWorkspaces() {
  return useQuery({
    queryKey: workspacesQueryKey,
    queryFn: () =>
      apiClient.get<ListResult<WorkspaceWithRole>>("/api/v1/workspaces"),
  });
}

// Returns a "mutate" function for creating a new workspace.
export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWorkspaceInput) =>
      apiClient.post<Workspace>("/api/v1/workspaces", input),
    onSuccess: (workspace) => {
      toast.success(`Workspace "${workspace.name}" created`);
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Failed to create workspace"));
    },
    // Whether it succeeded or failed, refetch the workspace list so it's up to date.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: workspacesQueryKey });
    },
  });
}

// Returns a "mutate" function for deleting a workspace, with an optimistic UI update: the workspace disappears from the list immediately, before the server has actually confirmed the delete.

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workspaceId: string) =>
      apiClient.delete<Workspace>(`/api/v1/workspaces/${workspaceId}`),
    
    // Runs immediately, before the request finishes: remove the workspace from the cached list right away, but remember the old list in case we need to undo this.
    
    onMutate: async (workspaceId) => {
      await queryClient.cancelQueries({ queryKey: workspacesQueryKey });
      const previous = queryClient.getQueryData<ListResult<WorkspaceWithRole>>(
        workspacesQueryKey,
      );
      if (previous) {
        queryClient.setQueryData<ListResult<WorkspaceWithRole>>(
          workspacesQueryKey,
          {
            ...previous,
            items: previous.items.filter((w) => w.id !== workspaceId),
          },
        );
      }
      return { previous };
    },
    // If the delete actually failed, put the old list back (undo the optimistic removal).
    onError: (error, _workspaceId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(workspacesQueryKey, context.previous);
      }
      toast.error(errorMessage(error, "Failed to delete workspace"));
    },
    onSuccess: () => {
      toast.success("Workspace deleted");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: workspacesQueryKey });
    },
  });
}
