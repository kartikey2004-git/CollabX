import GithubSlugger from "github-slugger";

// Mirrors how rehype-slug ids the actual rendered <h2>/<h3> elements (see markdown-view.tsx), so a
// TOC link's href always matches a real heading id. Only H2/H3 are collected — H1 is the article
// title, already rendered separately by ArticleDetail.

export interface HeadingItem {
  id: string;
  text: string;
  depth: 2 | 3;
}

const HEADING_PATTERN = /^(#{2,3})\s+(.+?)\s*#*$/;
const FENCE_PATTERN = /^(```|~~~)/;

// Strips the inline markdown emphasis/code markers rehype-slug's underlying hast-util-to-string
// would also strip (it slugs the heading's rendered text content, not its raw markdown source).
function stripInlineMarkup(text: string): string {
  return text.replace(/[`*_]/g, "").trim();
}

export function extractHeadings(markdown: string): HeadingItem[] {
  const slugger = new GithubSlugger();
  const headings: HeadingItem[] = [];
  let inFence = false;

  for (const line of markdown.split("\n")) {
    if (FENCE_PATTERN.test(line.trim())) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = HEADING_PATTERN.exec(line.trim());
    if (!match) continue;

    const depth = match[1].length as 2 | 3;
    const text = stripInlineMarkup(match[2]);
    if (!text) continue;

    headings.push({ id: slugger.slug(text), text, depth });
  }

  return headings;
}
