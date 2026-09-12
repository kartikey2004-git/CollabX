import { RoleGate } from "../../../../components/shared/role-gate";
import { IndexingDashboardList } from "../../../../components/admin/indexing-dashboard-list";

export default function AdminIndexingPage() {
  return (
    <RoleGate mode="admin" title="Admin access required" description="Only admins can view indexing status.">
      <IndexingDashboardList />
    </RoleGate>
  );
}
