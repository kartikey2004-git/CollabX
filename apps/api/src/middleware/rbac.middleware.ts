import { NextFunction, Request, Response } from "express";
import type { WorkspaceRole } from "@repo/database";
import { ForbiddenError, NotFoundError } from "../lib/errors";
import { workspaceMemberRepository } from "../repositories/workspace-member.repository";
import { projectRepository } from "../repositories/project.repository";
import { artifactRepository } from "../repositories/artifact.repository";

// Role groups used to control access based on a route's required permission level.
export const ALL_ROLES: WorkspaceRole[] = ["ADMIN", "EDITOR", "VIEWER"];
export const WRITE_ROLES: WorkspaceRole[] = ["ADMIN", "EDITOR"];
export const ADMIN_ONLY: WorkspaceRole[] = ["ADMIN"];

// A function that, given a request, figures out which workspace it belongs to.
type WorkspaceIdResolver = (req: Request) => Promise<string | null>;

// Route param is the workspace id directly (e.g. `/workspaces/:id`).
export const resolveWorkspaceIdFromParam =
  (paramName: string): WorkspaceIdResolver =>
  async (req) =>
    (req.params[paramName] as string | undefined) ?? null;

// Route param is a project id one level below the workspace (e.g. `/projects/:id`).
export const resolveWorkspaceIdFromProjectParam =
  (paramName: string): WorkspaceIdResolver =>
  async (req) => {
    // Look up which workspace this project belongs to.
    const projectId = req.params[paramName];
    if (!projectId) return null;
    return projectRepository.findWorkspaceIdById(projectId);
  };

// Route param is an artifact id two levels below the workspace (e.g. `/artifacts/:id`).
export const resolveWorkspaceIdFromArtifactParam =
  (paramName: string): WorkspaceIdResolver =>
  async (req) => {
    // Walk up: artifact -> its project -> that project's workspace.
    const artifactId = req.params[paramName];
    if (!artifactId) return null;
    const projectId = await artifactRepository.findProjectIdById(artifactId);
    if (!projectId) return null;
    return projectRepository.findWorkspaceIdById(projectId);
  };

/*

 - A middleware factory: checks that the logged-in user is a member of the specified workspace AND has one of the allowed roles, before letting the request continue. Used to protect routes based on workspace permissions.
 
 - If the user isn't even a member, we return 404 (not 403) — this way, someone without access can't tell the difference between "doesn't exist" and "exists but I'm not allowed to see it".

*/

export function requireWorkspaceRole(
  allowedRoles: WorkspaceRole[],
  resolveWorkspaceId: WorkspaceIdResolver,
) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Figure out which workspace this request is about.
      const workspaceId = await resolveWorkspaceId(req);
      if (!workspaceId) {
        throw new NotFoundError();
      }

      // Check whether the current user is actually a member of that workspace.
      const membership = await workspaceMemberRepository.findByWorkspaceAndUser(
        workspaceId,
        req.user!.id,
      );

      if (!membership) {
        throw new NotFoundError();
      }

      // Member exists, but do they have a role that's allowed for this action?
      if (!allowedRoles.includes(membership.role)) {
        throw new ForbiddenError();
      }

      // Save the membership info on the request so later code can reuse it.
      req.membership = { workspaceId, role: membership.role };
      next();
    } catch (err) {
      next(err);
    }
  };
}
