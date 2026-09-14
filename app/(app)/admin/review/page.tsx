import { RoleGate } from "../../../../components/shared/role-gate";
import { ReviewQueueList } from "../../../../components/admin/review-queue-list";

export default function AdminReviewPage() {
  return (
    <RoleGate
      mode="admin"
      title="Admin access required"
      description="Only admins can review pending submissions."
    >
      <ReviewQueueList />
    </RoleGate>
  );
}
