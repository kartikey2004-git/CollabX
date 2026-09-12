import { RoleGate } from "../../../components/shared/role-gate";
import { MyContentList } from "../../../components/dashboard/my-content-list";

export default function DashboardPage() {
  return (
    <RoleGate
      mode="contributor"
      title="Contributor access required"
      description="You need CONTRIBUTOR or ADMIN access to have content of your own. Ask an admin to upgrade your role."
    >
      <MyContentList />
    </RoleGate>
  );
}
