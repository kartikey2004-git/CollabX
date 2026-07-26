import db from "@repo/database";
import type { User } from "@repo/database";

export const userRepository = {
  // Find one user by their email address (used to resolve an invite's email to a platform user).
  findByEmail(email: string): Promise<User | null> {
    return db.user.findUnique({ where: { email } });
  },
};
