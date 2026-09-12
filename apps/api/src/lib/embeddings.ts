import { createHash } from "node:crypto";
import { config } from "../config";

// The embedding model VectorEmbedding.embeddingModel's own schema.prisma comment names as the
// expected value ("e.g. gemini-embedding-001"), and the dimensionality the `vector(768)` column
// (and its HNSW index) is fixed to — both ends must agree, so this constant is the single source
// of truth for both.
export const EMBEDDING_MODEL = "gemini-embedding-001";
export const EMBEDDING_DIMENSIONS = 768;

/*

Generates one embedding vector for a chunk of text, for the background indexing worker
(workers/indexing.worker.ts). Two paths:

- If GEMINI_API_KEY is configured, calls Gemini's embedContent REST endpoint directly (a plain
  fetch — no SDK dependency for one call), requesting EMBEDDING_DIMENSIONS explicitly so the
  result always matches the DB column regardless of the model's default output size.

- If it isn't configured, returns a deterministic, hash-seeded pseudo-embedding instead of
  failing outright. This is a LOCAL-DEV-ONLY PLACEHOLDER, not a real embedding — it lets the
  queue/worker/VectorEmbedding-write pipeline be built, run, and demoed end-to-end without a paid
  API key, matching this codebase's own habit of documenting accepted gaps (see
  docs/changes/008-final-summary.md) rather than silently faking correctness. Semantic search
  quality with this fallback is meaningless; only real Gemini calls produce usable similarity
  search.

*/
export async function getEmbedding(text: string): Promise<number[]> {
  if (!config.geminiApiKey) {
    return placeholderEmbedding(text);
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${config.geminiApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text }] },
        outputDimensionality: EMBEDDING_DIMENSIONS,
      }),
    },
  );

  if (!res.ok) {
    throw new Error(`Gemini embedding request failed: ${res.status} ${await res.text()}`);
  }

  const body = (await res.json()) as { embedding: { values: number[] } };
  return body.embedding.values;
}

// A pure function of the input text: same chunk always maps to the same vector, so re-running
// the indexing job against unchanged content is idempotent (matches the
// [submissionId, embeddingModel, contentHash] unique constraint's own intent).
function placeholderEmbedding(text: string): number[] {
  const values: number[] = [];
  let seed = createHash("sha256").update(text).digest();

  while (values.length < EMBEDDING_DIMENSIONS) {
    seed = createHash("sha256").update(seed).digest();
    for (let i = 0; i < seed.length && values.length < EMBEDDING_DIMENSIONS; i += 1) {
      // Map each byte (0-255) to a small float in [-1, 1] — pgvector cosine distance only cares
      // about direction, not magnitude, so the exact scale doesn't matter here.
      values.push(seed[i]! / 127.5 - 1);
    }
  }

  return values;
}
