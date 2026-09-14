import { RoleGate } from "../../../../../components/shared/role-gate";
import { ReviewDetail } from "../../../../../components/admin/review-detail";

export default function AdminReviewDetailPage({
  params,
}: {
  params: { submissionId: string };
}) {
  return (
    <RoleGate
      mode="admin"
      title="Admin access required"
      description="Only admins can review pending submissions."
    >
      <ReviewDetail submissionId={params.submissionId} />
    </RoleGate>
  );
}
