"use client";

import { useParams } from "next/navigation";
import { WorkspaceTree } from "../../../components/workspace/shared/workspace-tree";
import { BreadcrumbBar } from "../../../components/workspace/shared/breadcrumb-bar";
import { ContentPane } from "../../../components/workspace/shared/content-pane";

// The shell layout for a single workspace (/workspace/:workspaceId/...) which contains project/artifact tree on the left, and a breadcrumb + page content on the right.

export default function WorkspaceShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ workspaceId: string }>();

  return (
    <div className="flex h-screen w-full">
      <aside className="w-64 shrink-0 border-r border-gray-200 bg-gray-50">
        <WorkspaceTree workspaceId={params.workspaceId} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <BreadcrumbBar />
        <ContentPane>{children}</ContentPane>
      </div>
    </div>
  );
}
