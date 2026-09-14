import { RoleGate } from "../../../../components/shared/role-gate";
import { ManageUsersList } from "../../../../components/admin/manage-users-list";

export default function AdminUsersPage() {
  return (
    <RoleGate mode="admin" title="Admin access required" description="Only admins can manage users.">
      <ManageUsersList />
    </RoleGate>
  );
}
