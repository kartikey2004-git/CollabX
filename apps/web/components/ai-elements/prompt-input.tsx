"use client";

import { useCallback, type ComponentProps, type FormEvent, type KeyboardEventHandler } from "react";
import { CornerDownLeftIcon, SquareIcon } from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { Textarea } from "@repo/ui/components/textarea";
import { cn } from "@repo/ui/lib/utils";

// A minimal ai-elements-style prompt input, trimmed down from the upstream registry component
// (https://elements.ai-sdk.dev/components/prompt-input). That version also handles file
// attachments, screenshot capture, and a command-palette action menu — none of which apply to a
// plain text "ask about this article" chat, and pulling it in as-is would've dragged in `ai` and
// `nanoid` as dependencies just for that unused surface.

export type PromptInputStatus = "idle" | "submitted" | "streaming" | "error";

export type PromptInputProps = Omit<ComponentProps<"form">, "onSubmit"> & {
  onSubmit: (message: string, event: FormEvent<HTMLFormElement>) => void;
};

export function PromptInput({ className, onSubmit, ...props }: PromptInputProps) {
  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const text = (new FormData(event.currentTarget).get("message") as string | null)?.trim();
      if (!text) return;
      onSubmit(text, event);
    },
    [onSubmit],
  );

  return (
    <form onSubmit={handleSubmit} className={cn("flex items-end gap-2", className)} {...props} />
  );
}

export type PromptInputTextareaProps = ComponentProps<typeof Textarea>;

export function PromptInputTextarea({
  className,
  placeholder = "Ask about this page...",
  onKeyDown,
  ...props
}: PromptInputTextareaProps) {
  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
        event.preventDefault();
        event.currentTarget.form?.requestSubmit();
      }
    },
    [onKeyDown],
  );

  return (
    <Textarea
      name="message"
      placeholder={placeholder}
      onKeyDown={handleKeyDown}
      className={cn("max-h-48 min-h-10 flex-1 resize-none", className)}
      {...props}
    />
  );
}

export type PromptInputSubmitProps = ComponentProps<typeof Button> & {
  status?: PromptInputStatus;
};

export function PromptInputSubmit({ status, className, children, ...props }: PromptInputSubmitProps) {
  const isGenerating = status === "submitted" || status === "streaming";

  return (
    <Button
      type="submit"
      size="icon"
      className={cn("shrink-0", className)}
      disabled={isGenerating}
      aria-label={isGenerating ? "Sending" : "Send"}
      {...props}
    >
      {children ??
        (isGenerating ? (
          <SquareIcon className="h-4 w-4" />
        ) : (
          <CornerDownLeftIcon className="h-4 w-4" />
        ))}
    </Button>
  );
}
