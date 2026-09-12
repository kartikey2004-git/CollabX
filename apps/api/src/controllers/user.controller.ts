import { NextFunction, Request, Response } from "express";
import type { ListUsersQuery, UpdateUserRoleInput, UserIdParam } from "@repo/validation";
import type { Role } from "@repo/database";
import { userService } from "../services/user.service";
import { sendSuccess } from "../lib/response";

export const userController = {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as ListUsersQuery;
      const { items, nextCursor, hasMore } = await userService.listUsers(query);
      sendSuccess(res, items, { meta: { nextCursor, hasMore } });
    } catch (err) {
      next(err);
    }
  },

  async updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as unknown as UserIdParam;
      const input = req.body as UpdateUserRoleInput;
      const requester = { id: req.user!.id, role: req.user!.role as Role };
      const user = await userService.updateRole(id, input, requester);
      sendSuccess(res, user);
    } catch (err) {
      next(err);
    }
  },
};
