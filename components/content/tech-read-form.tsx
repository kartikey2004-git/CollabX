"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { createTechReadSchema, type CategoryInput } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MarkdownEditor } from "./markdown-editor";
import { useCreateTechRead } from "../../hooks/use-tech-reads";
import { CATEGORY_LABELS, CATEGORY_VALUES } from "../../lib/category-labels";

const NO_CATEGORY = "NONE" as const;

// Creates a TechRead + its v1 Submission together (POST /tech-reads). `externalUrl` is required —
// a TechRead only curates an external resource, it never hosts an original write-up (see
// schema.prisma's comment on TechRead.externalUrl). `category` is optional here (unlike Article).

export function TechReadForm() {
  const router = useRouter();
  const createTechRead = useCreateTechRead();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [category, setCategory] = useState<CategoryInput | typeof NO_CATEGORY>(NO_CATEGORY);
  const [tagsInput, setTagsInput] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const result = createTechReadSchema.safeParse({
      title,
      description: description || undefined,
      externalUrl,
      sourceName: sourceName || undefined,
      category: category === NO_CATEGORY ? undefined : category,
      tags: tags.length > 0 ? tags : undefined,
      content,
    });

    if (!result.success) {
      const { fieldErrors } = z.flattenError(result.error);
      setErrors({
        title: fieldErrors.title?.[0] ?? "",
        description: fieldErrors.description?.[0] ?? "",
        externalUrl: fieldErrors.externalUrl?.[0] ?? "",
        sourceName: fieldErrors.sourceName?.[0] ?? "",
        tags: fieldErrors.tags?.[0] ?? "",
        content: fieldErrors.content?.[0] ?? "",
      });
      return;
    }

    setErrors({});
    createTechRead.mutate(result.data, {
      onSuccess: (res) => router.push(`/tech-reads/${res.techRead.slug}`),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="tr-title">Title</Label>
        <Input
          id="tr-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Understanding Raft consensus"
          disabled={createTechRead.isPending}
          autoFocus
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tr-url">External URL</Label>
        <Input
          id="tr-url"
          type="url"
          value={externalUrl}
          onChange={(e) => setExternalUrl(e.target.value)}
          placeholder="https://..."
          disabled={createTechRead.isPending}
        />
        {errors.externalUrl && <p className="text-sm text-destructive">{errors.externalUrl}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tr-source">Source name (optional)</Label>
        <Input
          id="tr-source"
          value={sourceName}
          onChange={(e) => setSourceName(e.target.value)}
          placeholder="e.g. Martin Fowler's Blog"
          disabled={createTechRead.isPending}
        />
        {errors.sourceName && <p className="text-sm text-destructive">{errors.sourceName}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tr-description">Description (optional)</Label>
        <Textarea
          id="tr-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Your annotation/summary of the linked resource"
          disabled={createTechRead.isPending}
          rows={2}
        />
        {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tr-category">Category (optional)</Label>
          <Select
            value={category}
            onValueChange={(value) => setCategory(value as CategoryInput | typeof NO_CATEGORY)}
            disabled={createTechRead.isPending}
          >
            <SelectTrigger id="tr-category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_CATEGORY}>No category</SelectItem>
              {CATEGORY_VALUES.map((value) => (
                <SelectItem key={value} value={value}>
                  {CATEGORY_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tr-tags">Tags (comma-separated, optional)</Label>
          <Input
            id="tr-tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="distributed-systems, consensus"
            disabled={createTechRead.isPending}
          />
          {errors.tags && <p className="text-sm text-destructive">{errors.tags}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tr-content">Your write-up (Markdown)</Label>
        <MarkdownEditor
          id="tr-content"
          value={content}
          onChange={setContent}
          placeholder="Why this resource is worth reading..."
          disabled={createTechRead.isPending}
        />
        {errors.content && <p className="text-sm text-destructive">{errors.content}</p>}
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/tech-reads")}
          disabled={createTechRead.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={createTechRead.isPending}>
          {createTechRead.isPending ? "Creating..." : "Create draft"}
        </Button>
      </div>
    </form>
  );
}
