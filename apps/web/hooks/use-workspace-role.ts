"use client";

import type { WorkspaceRole } from "@repo/database";
import { useWorkspaces } from "./use-workspaces";

// Looks up the current user's role (ADMIN/EDITOR/VIEWER) in a specific workspace, by reusing the already-cached list of workspaces from useWorkspaces.

export function useWorkspaceRole(
  workspaceId: string,
): WorkspaceRole | undefined {
  const { data } = useWorkspaces();
  return data?.items.find((workspace) => workspace.id === workspaceId)?.role;
}

// Only ADMINs can manage workspace-level settings (rename, delete, members).
export function canManageWorkspace(role: WorkspaceRole | undefined): boolean {
  return role === "ADMIN";
}

// ADMINs and EDITORs can create/rename/delete projects and artifacts; VIEWERs can only look, not modify.
export function canManageProjectsAndArtifacts(
  role: WorkspaceRole | undefined,
): boolean {
  return role === "ADMIN" || role === "EDITOR";
}
