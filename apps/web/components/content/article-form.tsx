"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { createArticleSchema, type CategoryInput } from "@repo/validation";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Textarea } from "@repo/ui/components/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { MarkdownEditor } from "./markdown-editor";
import { useCreateArticle } from "../../hooks/use-articles";
import { CATEGORY_LABELS, CATEGORY_VALUES } from "../../lib/category-labels";

// Creates an Article + its v1 Submission together (POST /articles). There's no rich-text/WYSIWYG
// editor here — a plain Markdown textarea, per the task's own scope note that a rich editor isn't
// required. See 005-frontend-changes.md for that call.

export function ArticleForm() {
  const router = useRouter();
  const createArticle = useCreateArticle();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState<CategoryInput>("BACKEND_ENGINEERING");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const result = createArticleSchema.safeParse({
      title,
      summary: summary || undefined,
      category,
      content,
    });

    if (!result.success) {
      const { fieldErrors } = z.flattenError(result.error);
      setErrors({
        title: fieldErrors.title?.[0] ?? "",
        summary: fieldErrors.summary?.[0] ?? "",
        category: fieldErrors.category?.[0] ?? "",
        content: fieldErrors.content?.[0] ?? "",
      });
      return;
    }

    setErrors({});
    createArticle.mutate(result.data, {
      onSuccess: (res) => router.push(`/articles/${res.article.slug}`),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="article-title">Title</Label>
        <Input
          id="article-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="How we scaled our queue to 1M messages/sec"
          disabled={createArticle.isPending}
          autoFocus
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="article-summary">Summary (optional)</Label>
        <Textarea
          id="article-summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="A one or two sentence teaser shown in the article list"
          disabled={createArticle.isPending}
          rows={2}
        />
        {errors.summary && <p className="text-sm text-destructive">{errors.summary}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="article-category">Category</Label>
        <Select
          value={category}
          onValueChange={(value) => setCategory(value as CategoryInput)}
          disabled={createArticle.isPending}
        >
          <SelectTrigger id="article-category" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_VALUES.map((value) => (
              <SelectItem key={value} value={value}>
                {CATEGORY_LABELS[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="article-content">Content (Markdown)</Label>
        <MarkdownEditor
          id="article-content"
          value={content}
          onChange={setContent}
          placeholder={"## Introduction\n\nWrite your article in Markdown. ```mermaid fences are supported."}
          disabled={createArticle.isPending}
        />
        {errors.content && <p className="text-sm text-destructive">{errors.content}</p>}
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/articles")}
          disabled={createArticle.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={createArticle.isPending}>
          {createArticle.isPending ? "Creating..." : "Create draft"}
        </Button>
      </div>
    </form>
  );
}
