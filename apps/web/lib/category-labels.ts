import type { CategoryInput } from "@repo/validation";

// Human-readable labels for schema.prisma's `Category` enum, shown in select dropdowns and badges.
export const CATEGORY_LABELS: Record<CategoryInput, string> = {
  BACKEND_ENGINEERING: "Backend Engineering",
  FRONTEND_ENGINEERING: "Frontend Engineering",
  ENGINEER_ARTICLES: "Engineer Articles",
  SYSTEM_DESIGN: "System Design",
  DISTRIBUTED_SYSTEMS: "Distributed Systems",
  INFRASTRUCTURE: "Infrastructure",
  DEVOPS: "DevOps",
};

export const CATEGORY_VALUES = Object.keys(CATEGORY_LABELS) as CategoryInput[];
