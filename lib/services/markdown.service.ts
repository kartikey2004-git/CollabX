// Every piece of user-authored content in the new content model (Submission.content) is plain
// Markdown text (including ```mermaid fences, which render client-side — see schema.prisma's
// comment on Submission.content). There is no more per-artifact-type content shape (the OLD
// product's ArtifactType.EXCALIDRAW/DB_SCHEMA/MARKDOWN split is gone), so this service is trimmed
// down to the one function every resource actually needs: sanitizing a raw Markdown string.

// Markdown allows raw HTML to be embedded directly in its source. This strips the small set of
// tags/attributes that could actually execute something (script/style/iframe/object/embed/etc.,
// on*="" event handlers, javascript:/data:/vbscript: URLs in href/src) without touching anything
// else in the text.
//
// This is intentionally NOT a full HTML sanitizer (sanitize-html/htmlparser2) round-tripping the
// whole string: that approach parses the entire document as an HTML tree and re-serializes every
// text node HTML-escaped, which corrupts plain Markdown syntax that merely happens to contain a
// literal `<`, `>`, or `&` — e.g. `> a blockquote` becomes `&gt; a blockquote` (a bare paragraph,
// since the leading `>` that makes it a blockquote is gone by the time remark parses it), or
// `List<Item>` in prose becomes `List` (dropped entirely, since `<Item>` isn't a recognized tag).
// A regex-anchored blocklist of specific dangerous constructs avoids both failure modes: anything
// that isn't one of those constructs — including ordinary prose punctuation and benign inline HTML
// like `<b>`/`<a href="...">` — passes through unchanged.
//
// This is also genuinely defense-in-depth rather than the primary guard here: `components/content/
// markdown-view.tsx` renders via `react-markdown` without `rehype-raw`, so raw HTML embedded in the
// Markdown source is never executed by the app's own renderer regardless — it only ever shows up as
// inert text. This sanitizer matters for any *other* future consumer of Submission.content/
// Comment.body that might render it as raw HTML (an email digest, an RSS feed, a PDF export).

const DANGEROUS_TAGS = ["script", "style", "iframe", "object", "embed", "link", "meta", "base", "form"];

const DANGEROUS_TAG_PATTERN = new RegExp(`<\\/?(?:${DANGEROUS_TAGS.join("|")})\\b[^>]*>`, "gi");

// Matches ` onclick="..."`, ` onerror='...'`, ` onload=alert(1)` — quoted or bare — on any tag.
const EVENT_HANDLER_ATTRIBUTE_PATTERN = /\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi;

// Neutralizes javascript:/data:/vbscript: URLs in href="" or src="" by replacing the whole value
// with "#" rather than removing the attribute, so the tag's structure is otherwise left intact.
const UNSAFE_URL_ATTRIBUTE_PATTERN = /(href|src)\s*=\s*("|')\s*(?:javascript|data|vbscript):[^"']*\2/gi;

export function sanitizeMarkdownText(text: string): string {
  return text
    .replace(DANGEROUS_TAG_PATTERN, "")
    .replace(EVENT_HANDLER_ATTRIBUTE_PATTERN, "")
    .replace(UNSAFE_URL_ATTRIBUTE_PATTERN, '$1="#"');
}

export const markdownService = {
  sanitizeText: sanitizeMarkdownText,
};
