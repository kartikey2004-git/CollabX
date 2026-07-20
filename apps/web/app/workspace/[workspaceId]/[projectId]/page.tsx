"use client";

import { useParams } from "next/navigation";
import { ArtifactList } from "../../../../components/workspace/artifacts/artifact-list";

// Shows the list of artifacts inside one project (/workspace/:workspaceId/:projectId), unfiltered by type.

export default function ProjectArtifactsPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();

  return (
    <div className="p-6">
      <ArtifactList
        workspaceId={params.workspaceId}
        projectId={params.projectId}
        activeType={null}
      />
    </div>
  );
}
