"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Artifact } from "@repo/database";
import type {
  ArtifactTypeInput,
  CreateArtifactInput,
  UpdateArtifactInput,
} from "@repo/validation";
import { apiClient, ApiError, ListResult } from "../lib/api-client";

// A readable message to show the user: our API's own error message if we have one, otherwise a generic fallback string.

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

// A "query key" is how React Query identifies and caches a piece of data. Two calls with the same key share the same cached data; different keys (e.g. a different projectId or type filter) get their own cache entry.

export const artifactsQueryKey = (
  projectId: string,
  type?: ArtifactTypeInput,
) => ["projects", projectId, "artifacts", { type: type ?? null }] as const;

export const artifactQueryKey = (artifactId: string) =>
  ["artifacts", artifactId] as const;

// Fetch project artifacts (optionally filtered by type) and cache them using artifactsQueryKey. Wait until projectId is available before fetching.

export function useArtifacts(projectId: string, type?: ArtifactTypeInput) {
  return useQuery({
    queryKey: artifactsQueryKey(projectId, type),
    queryFn: () =>
      apiClient.get<ListResult<Artifact>>(
        `/api/v1/projects/${projectId}/artifacts${type ? `?type=${type}` : ""}`,
      ),
    enabled: Boolean(projectId),
  });
}

// Fetches a single artifact by id, cached under artifactQueryKey.
export function useArtifact(artifactId: string) {
  return useQuery({
    queryKey: artifactQueryKey(artifactId),
    queryFn: () => apiClient.get<Artifact>(`/api/v1/artifacts/${artifactId}`),
    enabled: Boolean(artifactId),
  });
}

// Returns a "mutate" function for creating a new artifact in this project.
export function useCreateArtifact(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({

    // The actual API call that runs when you call `.mutate(input)`.
    mutationFn: (input: CreateArtifactInput) =>
      apiClient.post<Artifact>(
        `/api/v1/projects/${projectId}/artifacts`,
        input,
      ),
    onSuccess: (artifact) => {
      toast.success(`"${artifact.title}" created`);
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Failed to create artifact"));
    },
    // Whether it succeeded or failed, refetch the artifact list so it's up to date.
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "artifacts"],
      });
    },
  });
}

// Returns a "mutate" function for renaming/editing an artifact.
export function useUpdateArtifact(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      artifactId,
      input,
    }: {
      artifactId: string;
      input: UpdateArtifactInput;
    }) => apiClient.patch<Artifact>(`/api/v1/artifacts/${artifactId}`, input),
    onError: (error) => {
      toast.error(errorMessage(error, "Failed to update artifact"));
    },

    // Directly write the fresh artifact into the cache, so the detail page updates instantly without waiting for a refetch.
    onSuccess: (artifact) => {
      queryClient.setQueryData(artifactQueryKey(artifact.id), artifact);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "artifacts"],
      });
    },
  });
}

// Returns a "mutate" function for deleting an artifact, with an optimistic UI update: the artifact disappears from the list immediately, before the server has actually confirmed the delete.

export function useDeleteArtifact(projectId: string) {
  const queryClient = useQueryClient();
  const queryKey = artifactsQueryKey(projectId);

  return useMutation({
    mutationFn: (artifactId: string) =>
      apiClient.delete<Artifact>(`/api/v1/artifacts/${artifactId}`),

    // Runs immediately, before the request finishes: remove the artifact from the cached list right away, but remember the old list in case we need to undo this.

    onMutate: async (artifactId) => {
      await queryClient.cancelQueries({
        queryKey: ["projects", projectId, "artifacts"],
      });
      const previous = queryClient.getQueryData<ListResult<Artifact>>(queryKey);
      if (previous) {
        queryClient.setQueryData<ListResult<Artifact>>(queryKey, {
          ...previous,
          items: previous.items.filter((a) => a.id !== artifactId),
        });
      }
      return { previous };
    },
    // If the delete actually failed, put the old list back (undo the optimistic removal).
    onError: (error, _artifactId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(errorMessage(error, "Failed to delete artifact"));
    },
    onSuccess: () => {
      toast.success("Artifact deleted");
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["projects", projectId, "artifacts"],
      });
    },
  });
}