import type { IndexStatusInput } from "@/lib/validation";
import { Badge } from "@/components/ui/badge";

const INDEX_STATUS_LABEL: Record<IndexStatusInput, string> = {
  NOT_INDEXED: "Not indexed",
  INDEXING: "Indexing…",
  INDEXED: "Indexed",
  STALE: "Stale",
};

// Same rationale as status-badge.tsx (StatusBadge) for the variant choices — no custom "warning"
// color in the shared design system, so STALE/INDEXING use "secondary" as the closest fit.
const INDEX_STATUS_VARIANT: Record<IndexStatusInput, "default" | "secondary" | "destructive" | "outline"> = {
  NOT_INDEXED: "outline",
  INDEXING: "secondary",
  INDEXED: "default",
  STALE: "secondary",
};

export function IndexingStatusBadge({ status }: { status: IndexStatusInput }) {
  return <Badge variant={INDEX_STATUS_VARIANT[status]}>{INDEX_STATUS_LABEL[status]}</Badge>;
}
