import { z } from "zod";

// The seven fixed top-level sections used to organize Articles (schema.prisma's `Category` enum).
// TechRead's category is optional (a curated read can span or ignore these), Article's is required.

export const categorySchema = z.enum([
  "BACKEND_ENGINEERING",
  "FRONTEND_ENGINEERING",
  "ENGINEER_ARTICLES",
  "SYSTEM_DESIGN",
  "DISTRIBUTED_SYSTEMS",
  "INFRASTRUCTURE",
  "DEVOPS",
]);

export type CategoryInput = z.infer<typeof categorySchema>;
