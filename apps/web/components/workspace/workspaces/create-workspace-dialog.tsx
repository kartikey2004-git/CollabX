"use client";

import { useState } from "react";
import { z } from "zod";
import { createWorkspaceSchema } from "@repo/validation";
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
import { useCreateWorkspace } from "../../../hooks/use-workspaces";

interface CreateWorkspaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// A modal form for creating a new workspace.
export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: CreateWorkspaceDialogProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const createWorkspace = useCreateWorkspace();

  // Validates the name against createWorkspaceSchema, then submits it.
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = createWorkspaceSchema.safeParse({ name });
    if (!result.success) {
      const { fieldErrors } = z.flattenError(result.error);
      setError(fieldErrors.name?.[0] ?? "Invalid workspace name");
      return;
    }
    setError("");

    // Reset the form and close the dialog once creation succeeds.
    createWorkspace.mutate(result.data, {
      onSuccess: () => {
        setName("");
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        
        // Prevent closing the dialog mid-request, so the user can't dismiss it while a create is still in flight.
        if (!createWorkspace.isPending) onOpenChange(next);
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create workspace</DialogTitle>
            <DialogDescription>
              A workspace holds projects and the artifacts inside them. You
              become its admin.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-2">
            <Label htmlFor="workspace-name">Name</Label>
            <Input
              id="workspace-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Corp"
              disabled={createWorkspace.isPending}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createWorkspace.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createWorkspace.isPending} className="rounded-sm bg-black text-white hover:bg-slate-800">
              {createWorkspace.isPending ? "Creating..." : "Create workspace"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
