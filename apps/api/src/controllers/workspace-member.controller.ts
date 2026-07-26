import { NextFunction, Request, Response } from "express";
import type { InviteWorkspaceMemberInput, UpdateWorkspaceMemberRoleInput } from "@repo/validation";
import { workspaceMemberService } from "../services/workspace-member.service";
import { sendSuccess } from "../lib/response";

export const workspaceMemberController = {
  async invite(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Handles "invite a member" requests (POST /workspaces/:workspaceId/members)

    try {
      // Extract workspaceId from the request parameters
      const { workspaceId } = req.params as { workspaceId: string };

      // Extract the input data which is email, role which we want to assign the member from the request body
      const input = req.body as InviteWorkspaceMemberInput;

      // Call the invite service function to invite the member
      const member = await workspaceMemberService.invite(workspaceId, input);

      // Send the response with the invited member
      sendSuccess(res, member, { status: 201 });
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Handles "list members" requests (GET /workspaces/:workspaceId/members).

    try {
      // Extract workspaceId from the request parameters
      const { workspaceId } = req.params as { workspaceId: string };

      // Call the list service function to list the members
      const members = await workspaceMemberService.list(workspaceId);

      // Send the response with the list of members
      sendSuccess(res, members);
    } catch (err) {
      next(err);
    }
  },

  async updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Handles "change a member's role" requests (PATCH /workspaces/:workspaceId/members/:userId).

    try {
      // Extract workspaceId and userId (id of the member whose role is to be updated) from the request parameters
      const { workspaceId, userId } = req.params as {
        workspaceId: string;
        userId: string;
      };

      // Extract the input data which is role which we want to assign the member from the request body
      const input = req.body as UpdateWorkspaceMemberRoleInput;

      // Call the update role service function to update the member's role
      const member = await workspaceMemberService.updateRole(workspaceId, userId, input);

      // Send the response with the updated member
      sendSuccess(res, member);
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Handles "remove a member" requests (DELETE /workspaces/:workspaceId/members/:userId).

    try {
      // Extract workspaceId and userId (id of the member to be removed) from the request parameters
      const { workspaceId, userId } = req.params as {
        workspaceId: string;
        userId: string;
      };

      // Call the remove service function to remove the member
      const member = await workspaceMemberService.remove(workspaceId, userId);

      // Send the response with the removed member
      sendSuccess(res, member);
    } catch (err) {
      next(err);
    }
  },
};
