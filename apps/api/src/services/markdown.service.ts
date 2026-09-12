import sanitizeHtml from "sanitize-html";

// Every piece of user-authored content in the new content model (Submission.content) is plain
// Markdown text (including ```mermaid fences, which render client-side — see schema.prisma's
// comment on Submission.content). There is no more per-artifact-type content shape (the OLD
// product's ArtifactType.EXCALIDRAW/DB_SCHEMA/MARKDOWN split is gone), so this service is trimmed
// down to the one function every resource actually needs: sanitizing a raw Markdown string.

// A conservative allowlist of HTML elements and attributes supported by the renderer. Anything
// outside this list (scripts, iframes, styles, inline event handlers) is removed during
// sanitization. Markdown syntax itself (headings, bold, links, lists, ```mermaid fences, etc.) is
// untouched — this only strips/cleans raw HTML embedded inside the Markdown source.

const ALLOWED_TAGS = [
  "p",
  "br",
  "hr",
  "b",
  "i",
  "em",
  "strong",
  "s",
  "del",
  "code",
  "pre",
  "blockquote",
  "a",
  "img",
  "ul",
  "ol",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
];

// Allowlist of attributes that are allowed on the allowed tags.
const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  a: ["href", "title"],
  img: ["src", "alt", "title"],
};

/*

  - Markdown allows raw HTML to be embedded directly in Markdown. Without sanitization, unsafe HTML such as `<script>` tags or `javascript:` URLs would be stored as-is and could execute when the content is rendered.

  - Standard Markdown syntax (headings, bold text, links, lists, ```mermaid fences, etc.) isn't affected. Sanitization only removes or cleans raw HTML embedded in the Markdown.

*/

export function sanitizeMarkdownText(text: string): string {
  return sanitizeHtml(text, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ["http", "https", "mailto"], // Only these schemes are allowed for href and src attributes.
    disallowedTagsMode: "discard", // Removes any tags that are not in the allowlist.
  });
}

export const markdownService = {
  sanitizeText: sanitizeMarkdownText,
};
