import sanitizeHtml from "sanitize-html";
import type { Prisma } from "@repo/database";

// MARKDOWN and DB_SCHEMA artifacts both store their content as `{ text: string }` Markdown. These are the artifact types this sanitizer is designed to handle.

const MARKDOWN_ARTIFACT_TYPES = new Set(["MARKDOWN", "DB_SCHEMA"]);

// A conservative allowlist of HTML elements and attributes supported by the editor. Anything outside this list such as scripts, iframes, styles, or inline event handlers is removed during sanitization.

// Allowlist of HTML tags that are allowed in the Markdown content.
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

  - Standard Markdown syntax (headings, bold text, links, lists, etc.) isn't affected. Sanitization only removes or cleans raw HTML embedded in the Markdown.

*/

function sanitizeMarkdownText(text: string): string {
  return sanitizeHtml(text, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ["http", "https", "mailto"], // Only these schemes are allowed for href and src attributes.
    disallowedTagsMode: "discard", // Removes any tags that are not in the allowlist.
  });
}

export const markdownService = {
  sanitizeText: sanitizeMarkdownText,

  // Sanitizes the content of Markdown-based artifacts (MARKDOWN and DB_SCHEMA). Other artifact types (such as EXCALIDRAW) are returned unchanged because this sanitizer only supports the `{ text: string }` content format.

  sanitizeContent(type: string, content: Prisma.InputJsonValue): Prisma.InputJsonValue {
    if (!MARKDOWN_ARTIFACT_TYPES.has(type)) return content; // If the artifact type is not Markdown-based, return the content as is.

    const { text } = content as { text: string };
    return { text: sanitizeMarkdownText(text) };
  },
};
