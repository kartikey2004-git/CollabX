"use client";

import { useState } from "react";
import { z } from "zod";
import { createArtifactSchema } from "@repo/validation";
import type { ArtifactTypeInput } from "@repo/validation";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { useCreateArtifact } from "../../../hooks/use-artifacts";

// Human-readable labels for each artifact type, shown in the type dropdown below.
const ARTIFACT_TYPE_LABELS: Record<ArtifactTypeInput, string> = {
  MARKDOWN: "Markdown document",
  EXCALIDRAW: "Excalidraw diagram",
  DB_SCHEMA: "Database schema",
};

interface CreateArtifactModalProps {
  projectId: string;
  defaultType?: ArtifactTypeInput;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// A modal form for creating a new artifact (document/diagram/schema) inside a project.
export function CreateArtifactModal({
  projectId,
  defaultType,
  open,
  onOpenChange,
}: CreateArtifactModalProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ArtifactTypeInput>(
    defaultType ?? "MARKDOWN",
  );
  const [error, setError] = useState("");
  const createArtifact = useCreateArtifact(projectId);

  // Validates the title/type against createArtifactSchema, then submits it.
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = createArtifactSchema.safeParse({ title, type });
    if (!result.success) {
      const { fieldErrors } = z.flattenError(result.error);
      setError(fieldErrors.title?.[0] ?? "Invalid title");
      return;
    }
    setError("");

    // Reset the form and close the dialog once creation succeeds.
    createArtifact.mutate(result.data, {
      onSuccess: () => {
        setTitle("");
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {

        // Prevent closing the dialog mid-request, so the user can't dismiss it while a create is still in flight.
        if (!createArtifact.isPending) onOpenChange(next);
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create artifact</DialogTitle>
            <DialogDescription>
              Add a document, diagram, or schema to this project.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="artifact-title">Title</Label>
              <Input
                id="artifact-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Getting Started"
                disabled={createArtifact.isPending}
                autoFocus
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="artifact-type">Type</Label>
              <Select
                value={type}
                onValueChange={(value) => setType(value as ArtifactTypeInput)}
                disabled={createArtifact.isPending}
              >
                <SelectTrigger id="artifact-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.keys(ARTIFACT_TYPE_LABELS) as ArtifactTypeInput[]
                  ).map((value) => (
                    <SelectItem key={value} value={value}>
                      {ARTIFACT_TYPE_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createArtifact.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createArtifact.isPending} className="rounded-sm bg-black text-white hover:bg-slate-800">
              {createArtifact.isPending ? "Creating..." : "Create artifact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
