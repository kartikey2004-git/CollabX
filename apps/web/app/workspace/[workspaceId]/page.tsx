"use client";

import { useParams } from "next/navigation";
import { ProjectList } from "../../../components/workspace/projects/project-list";

// Shows the list of projects inside one workspace (/workspace/:workspaceId).
export default function WorkspaceProjectsPage() {
  const params = useParams<{ workspaceId: string }>();

  return (
    <div className="p-6">
      <ProjectList workspaceId={params.workspaceId} />
    </div>
  );
}
