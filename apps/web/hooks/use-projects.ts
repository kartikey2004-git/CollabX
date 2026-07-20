"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Project } from "@repo/database";
import type { CreateProjectInput } from "@repo/validation";
import { apiClient, ApiError, ListResult } from "../lib/api-client";

// A readable message to show the user: our API's own error message if we have one, otherwise a generic fallback string.

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

// The cache key for "the list of projects in this workspace" — used so React Query knows which cached data to read, update, or refetch.

export const projectsQueryKey = (workspaceId: string) =>
  ["workspaces", workspaceId, "projects"] as const;

// Fetches the list of projects belonging to a workspace.
export function useProjects(workspaceId: string) {
  return useQuery({
    queryKey: projectsQueryKey(workspaceId),
    queryFn: () =>
      apiClient.get<ListResult<Project>>(
        `/api/v1/workspaces/${workspaceId}/projects`,
      ),
    enabled: Boolean(workspaceId),
  });
}

// Returns a "mutate" function for creating a new project in this workspace.
export function useCreateProject(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectInput) =>
      apiClient.post<Project>(
        `/api/v1/workspaces/${workspaceId}/projects`,
        input,
      ),
    onSuccess: (project) => {
      toast.success(`Project "${project.name}" created`);
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Failed to create project"));
    },
    // Whether it succeeded or failed, refetch the project list so it's up to date.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: projectsQueryKey(workspaceId) });
    },
  });
}

// Returns a "mutate" function for deleting a project, with an optimistic UI update: the project disappears from the list immediately, before the server has actually confirmed the delete.

export function useDeleteProject(workspaceId: string) {
  const queryClient = useQueryClient();
  const queryKey = projectsQueryKey(workspaceId);

  return useMutation({
    mutationFn: (projectId: string) =>
      apiClient.delete<Project>(`/api/v1/projects/${projectId}`),
    
    // Runs immediately, before the request finishes: remove the project from the cached list right away, but remember the old list in case we need to undo this.

    onMutate: async (projectId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ListResult<Project>>(queryKey);
      if (previous) {
        queryClient.setQueryData<ListResult<Project>>(queryKey, {
          ...previous,
          items: previous.items.filter((p) => p.id !== projectId),
        });
      }
      return { previous };
    },
    // If the delete actually failed, put the old list back (undo the optimistic removal).
    onError: (error, _projectId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(errorMessage(error, "Failed to delete project"));
    },
    onSuccess: () => {
      toast.success("Project deleted");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
