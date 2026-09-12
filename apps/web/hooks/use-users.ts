"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { User } from "@repo/database";
import type { RoleInput } from "@repo/validation";
import { apiClient, ApiError, ListResult } from "../lib/api-client";
import { buildQuery } from "../lib/query-string";

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export const usersQueryKey = (role?: RoleInput) => ["users", "list", role ?? null] as const;

// GET /users — ADMIN-only. The list is small enough (every user on the platform) that a plain
// query is enough; no need for useInfiniteQuery like the content-listing hooks.
export function useUsers(role?: RoleInput) {
  return useQuery({
    queryKey: usersQueryKey(role),
    queryFn: () =>
      apiClient.get<ListResult<User>>(`/api/v1/users${buildQuery({ role, limit: 100 })}`),
  });
}

// PATCH /users/:id/role — ADMIN-only. Same shape as use-tech-reads.ts's
// useUpdateTechReadTrending: toast on success/error, invalidate the list on settle.
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: RoleInput }) =>
      apiClient.patch<User>(`/api/v1/users/${id}/role`, { role }),
    onSuccess: (user) => {
      toast.success(`${user.name}'s role is now ${user.role}`);
    },
    onError: (error) => {
      toast.error(errorMessage(error, "Failed to update role"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
