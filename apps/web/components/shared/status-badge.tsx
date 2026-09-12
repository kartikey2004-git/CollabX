import type { ContentStatusInput } from "@repo/validation";
import { Badge } from "@repo/ui/components/badge";

const STATUS_LABEL: Record<ContentStatusInput, string> = {
  DRAFT: "Draft",
  PENDING_REVIEW: "Pending review",
  PUBLISHED: "Published",
  REJECTED: "Rejected",
};

// Badge variants come from @repo/ui/components/badge's own variant set (default/secondary/
// destructive/outline) — there's no custom "warning" color in the shared design system, so
// PENDING_REVIEW uses "secondary" and REJECTED uses "destructive" as the closest fit.
const STATUS_VARIANT: Record<ContentStatusInput, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "outline",
  PENDING_REVIEW: "secondary",
  PUBLISHED: "default",
  REJECTED: "destructive",
};

export function StatusBadge({ status }: { status: ContentStatusInput }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
