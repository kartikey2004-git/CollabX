"use client";

import { useParams } from "next/navigation";
import { useWorkspaces } from "../../../hooks/use-workspaces";
import { useProjects } from "../../../hooks/use-projects";
import { useArtifact } from "../../../hooks/use-artifacts";

// Shows a "Workspace / Project / Artifact" trail at the top of the content pane, built from whichever ids are present in the current URL.
  
export function BreadcrumbBar() {
  const params = useParams<{
    workspaceId: string;
    projectId?: string;
    artifactId?: string;
  }>();
  const { data: workspacesData } = useWorkspaces();
  const workspace = workspacesData?.items.find(
    (w) => w.id === params.workspaceId,
  );
  const { data: projectsData } = useProjects(params.workspaceId);
  const project = projectsData?.items.find((p) => p.id === params.projectId);
  const { data: artifact } = useArtifact(params.artifactId ?? "");

  // Build the list of names to display, dropping any level that isn't present in the URL or hasn't loaded yet.

  const segments = [
    workspace?.name,
    params.projectId ? project?.name : undefined,
    params.artifactId ? artifact?.title : undefined,
  ].filter((segment): segment is string => Boolean(segment));

  return (
    <header className="flex h-12 shrink-0 items-center border-b border-gray-200 bg-white px-4">
      <p className="truncate font-mono text-sm">
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          return (
            <span key={index}>
              {index > 0 && <span className="text-gray-400"> / </span>}
              <span className={isLast ? "font-bold text-black" : "text-gray-400"}>
                {segment}
              </span>
            </span>
          );
        })}
      </p>
    </header>
  );
}
