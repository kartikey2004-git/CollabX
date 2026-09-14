// Splits a Submission's Markdown body into roughly-1000-character chunks for embedding, breaking
// on blank lines (paragraph/heading boundaries) so a chunk never cuts a sentence in half unless a
// single paragraph is already over the limit. Deliberately simple (no new dependency) — this is
// the "AI-powered search/indexing" queue's chunking step, not a general-purpose text splitter.

const MAX_CHUNK_LENGTH = 1000;

export function chunkMarkdown(content: string): string[] {
  const paragraphs = content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;

    if (candidate.length <= MAX_CHUNK_LENGTH) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current);
    }

    // A single paragraph longer than the limit on its own — hard-split it rather than producing
    // one giant chunk (still deterministic and reversible via chunkIndex, just not
    // paragraph-aligned for this one case).
    if (paragraph.length > MAX_CHUNK_LENGTH) {
      for (let i = 0; i < paragraph.length; i += MAX_CHUNK_LENGTH) {
        chunks.push(paragraph.slice(i, i + MAX_CHUNK_LENGTH));
      }
      current = "";
    } else {
      current = paragraph;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}
