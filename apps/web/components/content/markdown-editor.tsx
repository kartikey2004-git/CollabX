"use client";

import { useRef, type ChangeEvent, type ComponentType } from "react";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Minus,
  Table as TableIcon,
} from "lucide-react";
import { Button } from "@repo/ui/components/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@repo/ui/components/resizable";
import { MarkdownView } from "./markdown-view";

interface Selection {
  text: string;
  start: number;
  end: number;
}

interface ToolbarAction {
  label: string;
  icon: ComponentType<{ className?: string }>;
  // eslint-disable-next-line no-unused-vars -- named for readability; this is a type position, not a real binding
  apply: (value: string, start: number, end: number) => Selection;
}

// Wraps the current selection in `marker` on both sides (bold/italic/inline code) — falls back to a
// placeholder word when nothing is selected, then selects that placeholder so typing replaces it.
function wrapSelection(marker: string) {
  return (value: string, start: number, end: number): Selection => {
    const selected = value.slice(start, end) || "text";
    const text = value.slice(0, start) + marker + selected + marker + value.slice(end);
    return { text, start: start + marker.length, end: start + marker.length + selected.length };
  };
}

// Inserts `prefix` at the start of the current line (headings/list items).
function prefixLine(prefix: string) {
  return (value: string, start: number, end: number): Selection => {
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const text = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    return { text, start: start + prefix.length, end: end + prefix.length };
  };
}

// Inserts a standalone block (table/rule) on its own line after the cursor.
function insertBlock(block: string) {
  return (value: string, start: number, end: number): Selection => {
    const needsLeadingNewline = start > 0 && value[start - 1] !== "\n";
    const insertion = `${needsLeadingNewline ? "\n" : ""}${block}\n`;
    const text = value.slice(0, start) + insertion + value.slice(end);
    const cursor = start + insertion.length;
    return { text, start: cursor, end: cursor };
  };
}

const TOOLBAR: ToolbarAction[] = [
  { label: "Heading 1", icon: Heading1, apply: prefixLine("# ") },
  { label: "Heading 2", icon: Heading2, apply: prefixLine("## ") },
  { label: "Heading 3", icon: Heading3, apply: prefixLine("### ") },
  { label: "Bold", icon: Bold, apply: wrapSelection("**") },
  { label: "Italic", icon: Italic, apply: wrapSelection("_") },
  { label: "Inline code", icon: Code, apply: wrapSelection("`") },
  { label: "Bullet list", icon: List, apply: prefixLine("- ") },
  { label: "Numbered list", icon: ListOrdered, apply: prefixLine("1. ") },
  {
    label: "Table",
    icon: TableIcon,
    apply: insertBlock("| Column | Column |\n| --- | --- |\n| Cell | Cell |"),
  },
  { label: "Divider", icon: Minus, apply: insertBlock("---") },
];

interface MarkdownEditorProps {
  id?: string;
  value: string;
  // eslint-disable-next-line no-unused-vars -- named for readability; this is a type position, not a real binding
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  height?: number;
}

export function MarkdownEditor({ id, value, onChange, placeholder, disabled, height = 420 }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const lineCount = Math.max(1, value.split("\n").length);

  const runAction = (action: ToolbarAction) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd } = textarea;
    const { text, start, end } = action.apply(value, selectionStart, selectionEnd);
    onChange(text);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start, end);
    });
  };

  const syncGutterScroll = () => {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-md border" style={{ height }}>
      <div className="flex shrink-0 flex-wrap items-center gap-0.5 border-b bg-muted/40 px-1.5 py-1">
        {TOOLBAR.map((action) => (
          <Button
            key={action.label}
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled}
            aria-label={action.label}
            title={action.label}
            onClick={() => runAction(action)}
          >
            <action.icon className="h-4 w-4" />
          </Button>
        ))}
      </div>

      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize="50%" minSize="25%">
          <div className="flex h-full">
            <div
              ref={gutterRef}
              aria-hidden="true"
              className="h-full shrink-0 select-none overflow-hidden bg-muted/30 px-2 py-3 text-right font-mono text-sm leading-6 text-muted-foreground"
            >
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <textarea
              ref={textareaRef}
              id={id}
              value={value}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
              onScroll={syncGutterScroll}
              placeholder={placeholder}
              disabled={disabled}
              spellCheck={false}
              className="h-full w-full flex-1 resize-none bg-transparent px-3 py-3 font-mono text-sm leading-6 outline-none"
            />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="50%" minSize="25%">
          <div className="h-full overflow-auto px-4 py-3">
            {value.trim() ? (
              <MarkdownView content={value} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
                <p className="text-sm font-medium">Start writing</p>
                <p className="text-sm text-muted-foreground">
                  Type or paste markdown content to see a live preview
                </p>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
