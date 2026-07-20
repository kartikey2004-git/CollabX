"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Plus,
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import type { Project } from "@repo/database";
import type { ArtifactTypeInput } from "@repo/validation";
import { useWorkspaces } from "../../../hooks/use-workspaces";
import { useProjects } from "../../../hooks/use-projects";
import { useArtifacts } from "../../../hooks/use-artifacts";
import {
  canManageProjectsAndArtifacts,
  useWorkspaceRole,
} from "../../../hooks/use-workspace-role";
import { ArtifactTypeIcon } from "../artifacts/artifact-type-icon";
import { CreateProjectDialog } from "../projects/create-project-dialog";

interface WorkspaceTreeProps {
  workspaceId: string;
}

// The collapsible sidebar tree: workspace -> projects -> artifacts. Lets users navigate and expand/collapse each level, and create new projects.

export function WorkspaceTree({ workspaceId }: WorkspaceTreeProps) {
  const params = useParams<{ projectId?: string; artifactId?: string }>();
  const { data: workspacesData } = useWorkspaces();
  const workspace = workspacesData?.items.find((w) => w.id === workspaceId);
  const { data: projectsData, isPending } = useProjects(workspaceId);
  const role = useWorkspaceRole(workspaceId);
  const canManage = canManageProjectsAndArtifacts(role);

  const [rootExpanded, setRootExpanded] = useState(true);

  // Tracks which project nodes are expanded; starts with the currently-open project (from the URL) already expanded.

  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(
    new Set(params.projectId ? [params.projectId] : []),
  );

  const [createProjectOpen, setCreateProjectOpen] = useState(false);

  // Flips one project between expanded/collapsed, leaving the others untouched.

  const toggleProject = (id: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <nav
      className="flex h-full flex-col bg-gray-50 text-sm"
      aria-label="Workspace navigation"
    >
      <div className="flex items-center gap-1 px-3 py-3">
        <Link
          href="/workspace"
          className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          aria-label="All workspaces"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Link>
        <button
          type="button"
          onClick={() => setRootExpanded((v) => !v)}
          className="flex flex-1 items-center gap-1.5 truncate rounded px-1 py-1 text-left font-semibold text-gray-900 hover:bg-gray-100"
        >
          {rootExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400" />
          )}
          <span className="truncate">{workspace?.name ?? "Workspace"}</span>
        </button>
      </div>

      {rootExpanded && (
        <div className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-2">
          {isPending && (
            <div className="px-2 py-1 text-xs text-gray-400">Loading…</div>
          )}
          {!isPending && projectsData?.items.length === 0 && (
            <div className="px-2 py-1 text-xs text-gray-400">
              No projects yet
            </div>
          )}
          {projectsData?.items.map((project) => (
            <ProjectNode
              key={project.id}
              workspaceId={workspaceId}
              project={project}
              expanded={expandedProjects.has(project.id)}
              onToggle={() => toggleProject(project.id)}
              activeProjectId={params.projectId}
              activeArtifactId={params.artifactId}
            />
          ))}
        </div>
      )}

      {canManage && (
        <div className="border-t border-gray-200 px-2 py-2">
          <button
            type="button"
            onClick={() => setCreateProjectOpen(true)}
            className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            <Plus className="h-3.5 w-3.5" />
            New project
          </button>
        </div>
      )}

      <CreateProjectDialog
        workspaceId={workspaceId}
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
      />
    </nav>
  );
}

interface ProjectNodeProps {
  workspaceId: string;
  project: Project;
  expanded: boolean;
  onToggle: () => void;
  activeProjectId?: string;
  activeArtifactId?: string;
}

// One project row in the tree: a name you can click to navigate to it, and a chevron to expand/collapse its artifacts below.

function ProjectNode({
  workspaceId,
  project,
  expanded,
  onToggle,
  activeProjectId,
  activeArtifactId,
}: ProjectNodeProps) {
  const router = useRouter();
  const isActiveProject = activeProjectId === project.id && !activeArtifactId;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded px-1 py-1.5",
          isActiveProject ? "bg-gray-100" : "hover:bg-gray-100",
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          className="shrink-0 rounded p-0.5 text-gray-400 hover:text-gray-600"
          aria-label={expanded ? "Collapse project" : "Expand project"}
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/workspace/${workspaceId}/${project.id}`)}
          className="flex flex-1 items-center gap-1.5 truncate py-0.5 text-left text-gray-700 group-hover:text-gray-900"
        >
          <FolderKanban className="h-4 w-4 shrink-0 text-gray-400" />
          <span className="truncate">{project.name}</span>
        </button>
      </div>

      {expanded && (
        <ProjectArtifacts
          workspaceId={workspaceId}
          projectId={project.id}
          activeArtifactId={activeArtifactId}
        />
      )}
    </div>
  );
}

// The list of artifacts shown under an expanded project node.
function ProjectArtifacts({
  workspaceId,
  projectId,
  activeArtifactId,
}: {
  workspaceId: string;
  projectId: string;
  activeArtifactId?: string;
}) {
  const router = useRouter();
  const { data, isPending } = useArtifacts(projectId);

  if (isPending) {
    return (
      <div className="ml-6 border-l border-gray-200 py-1 pl-2 text-xs text-gray-400">
        Loading…
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="ml-6 border-l border-gray-200 py-1 pl-2 text-xs text-gray-400">
        No artifacts
      </div>
    );
  }

  return (
    <div className="ml-3 space-y-0.5 border-l border-gray-200 pl-2">
      {data.items.map((artifact) => {
        const isActive = activeArtifactId === artifact.id;
        return (
          <button
            key={artifact.id}
            type="button"
            onClick={() =>
              router.push(`/workspace/${workspaceId}/${projectId}/${artifact.id}`)
            }
            className={cn(
              "group flex w-full items-center gap-2 truncate rounded-full px-2.5 py-1.5 text-left transition-colors",
              isActive
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
            )}
          >
            <ArtifactTypeIcon
              type={artifact.type as ArtifactTypeInput}
              active={isActive}
            />
            <span className="truncate">{artifact.title}</span>
          </button>
        );
      })}
    </div>
  );
}
