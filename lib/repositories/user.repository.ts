import db from "../db";
import type { Prisma, Role, User } from "../db";
import { buildKeysetWhere, decodeCursor, paginateResults } from "../pagination";

export interface ListUsersParams {
  role?: Role;
  cursor?: string;
  limit: number;
}

export const userRepository = {
  findById(id: string): Promise<User | null> {
    return db.user.findUnique({ where: { id } });
  },

  // Admin "manage users" listing — same cursor-pagination shape as
  // article.repository.ts::findPublished, sorted newest-first by the existing
  // `User.@@index([createdAt])`.
  async list(params: ListUsersParams) {
    const cursor = params.cursor ? decodeCursor(params.cursor) : undefined;
    const keysetWhere = buildKeysetWhere("createdAt", "desc", cursor);

    const where = {
      ...(params.role ? { role: params.role } : {}),
      ...(keysetWhere ?? {}),
    } as Prisma.UserWhereInput;

    const rows = await db.user.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: params.limit + 1,
    });

    return paginateResults(rows, params.limit, "createdAt");
  },

  updateRole(id: string, role: Role): Promise<User> {
    return db.user.update({ where: { id }, data: { role } });
  },
};
