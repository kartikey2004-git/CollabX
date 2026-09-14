"use client";

import { isValidElement } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { MermaidDiagram } from "./mermaid-diagram";

/*

Renders a Submission's Markdown content. `react-markdown` was added as a new dependency
(apps/web/package.json) — nothing in the repo already depended on a Markdown renderer (checked
package-lock.json and apps/api's own dependencies; apps/api only uses `sanitize-html` to clean raw
HTML embedded *inside* Markdown, server-side, which is unrelated to rendering the Markdown itself
client-side). `react-markdown` never uses `dangerouslySetInnerHTML` — it parses to a React element
tree — so this is safe defense-in-depth on top of (not a replacement for) the backend's own
sanitization in `sanitizeMarkdownText`.

remark-gfm adds the GitHub-flavored extensions CommonMark alone doesn't parse: tables, ~~strikethrough~~,
- [ ] task lists, footnotes[^1], and bare-URL autolinking. Without it, e.g. a pipe-table in the
source would just render as a plain paragraph of literal `|` characters — the `.markdown-body table`
CSS rules already existed for when this got wired up.

Mermaid diagrams inside ```mermaid fences are intercepted by the `code`/`pre` overrides below and
rendered by MermaidDiagram (which does use dangerouslySetInnerHTML, scoped to just that component —
see its own comment for why that's unavoidable and acceptable here). `pre` normally wraps every
fenced code block, but MermaidDiagram renders a `<div>`, which isn't valid inside `<pre>` — so `pre`
unwraps itself only when its child is a mermaid block, otherwise it renders exactly as before. Every
other fenced/inline code block is completely unaffected.

*/

// rehypeSlug ids every rendered heading with github-slugger, the same slugger
// lib/markdown-headings.ts uses to build the sidebar's TOC — keeping the two in sync is what lets a
// TOC link's href actually land on the right heading.

function languageOf(className: string | null | undefined): string | undefined {
  return /language-(\w+)/.exec(className ?? "")?.[1];
}

const components: Components = {
  pre({ children, ...props }) {
    const child = Array.isArray(children) ? children[0] : children;
    const childClassName = isValidElement<{ className?: string }>(child)
      ? child.props.className
      : undefined;

    if (languageOf(childClassName) === "mermaid") {
      return <>{children}</>;
    }
    return <pre {...props}>{children}</pre>;
  },
  code({ className, children, ...props }) {
    if (languageOf(className) === "mermaid") {
      return <MermaidDiagram code={String(children).replace(/\n$/, "")} />;
    }
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
};

export function MarkdownView({ content }: { content: string }) {
  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
