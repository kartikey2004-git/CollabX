"use client";

import { Database, FileText, Workflow } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ArtifactTypeInput } from "@repo/validation";
import { cn } from "@repo/ui/lib/utils";

// Maps each artifact type to the icon used to represent it throughout the UI.
export const ARTIFACT_TYPE_ICON: Record<ArtifactTypeInput, LucideIcon> = {
  MARKDOWN: FileText,
  EXCALIDRAW: Workflow,
  DB_SCHEMA: Database,
};

// Human-readable labels for each artifact type (used e.g. as badge text).
export const ARTIFACT_TYPE_LABEL: Record<ArtifactTypeInput, string> = {
  MARKDOWN: "Markdown document",
  EXCALIDRAW: "Diagram",
  DB_SCHEMA: "Database schema",
};

interface ArtifactTypeIconProps {
  type: ArtifactTypeInput;
  active?: boolean;
  className?: string;
}

// Renders the correct icon for an artifact's type, styled differently depending on whether it's the currently-active/selected item.

export function ArtifactTypeIcon({
  type,
  active,
  className,
}: ArtifactTypeIconProps) {
  const Icon = ARTIFACT_TYPE_ICON[type];

  return (
    <Icon
      className={cn(
        "h-4 w-4 shrink-0",
        active ? "text-white" : "text-gray-500 group-hover:text-gray-700",
        className,
      )}
    />
  );
}
