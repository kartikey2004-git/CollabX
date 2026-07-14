import { SidebarProvider, Sidebar, SidebarInset } from "@repo/ui/components/sidebar";
import { AppSidebar } from "../../components/workspace/app-sidebar";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar collapsible="icon">
        <AppSidebar />
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
