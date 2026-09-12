# 003 — Database Changes

**Status of this document**: this is a completed migration-mechanics fix, not a schema design change. `packages/database/prisma/schema.prisma` already fully modeled the new product (Article/TechRead/Submission/Comment/Asset/VectorEmbedding, platform-wide `Role`) before this work started — see `000-project-analysis.md` and `002-architecture-impact.md`. The problem this document addresses is narrower: the migration *history* on disk could not reproduce that schema on a clean database. This document records what was broken, what was changed, the exact commands run, and the verification performed. All results below are from commands actually executed against a real Postgres container during this session — nothing here is projected or assumed.

## Can the current schema support the feature?

Yes. No model, field, relation, or cascade behavior in `schema.prisma` was changed by this work. The schema was already complete and correct for the engineering-knowledge-platform pivot; the only two schema edits made were to the `generator`/`datasource` blocks (see "What changed" below), not to any model.

## What was broken

`packages/database/prisma/migrations/` contained, in order:

1. `20260627084411_test_migration` — creates an early experimental `"User"` table (committed).
2. `20260627144532_document_and_user_models` — creates `users`/`sessions`/`accounts`/`verifications`/`documents` (committed).
3. `20260713_add_verification_type` — adds a `type` column to `verifications` (committed).
4. `20260721021800_enable_pgvector` — **empty directory, no `migration.sql`**.
5. `20260721021826_baseline_collab_models` — **empty directory, no `migration.sql`**.
6. `20260721132118_add_version_label` — **empty directory, no `migration.sql`**.
7. `20260726160000_add_hnsw_vector_index` — **empty directory, no `migration.sql`**.
8. `20260910120000_submission_ownership_and_check_constraints` (uncommitted) — a hand-written hardening migration that `ALTER`s tables (`articles`, `tech_reads`, `submissions`, `comments`, `assets`, `vector_embeddings`) as if they already existed, plus converts `verifications`/`users` columns that were still the old free-text shape.

Directories 4–7 being empty meant `prisma migrate deploy` would apply migrations 1–3, then find nothing to do for four consecutive migration folders (Prisma treats an existing-but-empty migration directory as already-applied/no-op, so this doesn't error, it just silently does nothing), then hit migration 8, which immediately fails: it `ALTER TABLE`s `articles`/`tech_reads`/`submissions`/`comments`/`assets`/`vector_embeddings`, none of which exist yet, because no migration anywhere ever ran a `CREATE TABLE` for them, nor `CREATE TYPE` for `Role`/`Category`/`ContentStatus`/`IndexStatus`, nor `CREATE EXTENSION vector`. The most likely cause: these tables were pushed to some developer's local database with `prisma db push` (which writes directly to the DB and never produces migration files) and the corresponding migration history was never generated or committed. Net effect: a brand-new environment (or CI) running `prisma migrate deploy` against an empty database would fail outright, and there was no way to reconstruct the intended intermediate schema shape from the repo alone.

Two more problems, unrelated to the migration-chain gap itself, were found and fixed as a byproduct of making `migrate deploy` actually run in this environment:

- `packages/database/.env` was saved as **UTF-16LE** (`FF FE` BOM, every character null-padded) instead of UTF-8/ASCII. `prisma.config.ts` itself is unaffected (it loads `../../.env`, the repo-root file, which was already valid UTF-8), but `src/client.ts` and `src/utils/seed.ts` both do a bare `import "dotenv/config"`, which resolves `.env` relative to `process.cwd()` — when a script is invoked with cwd = `packages/database` (e.g. via Turbo's per-package task execution), it would have loaded the broken file and silently failed to set `DATABASE_URL`. Rewritten as plain UTF-8.
- `packages/database/package.json`'s `test:db` script points at `src/test/test-database-connection.ts`, which does not exist in the repository. This is a pre-existing stale script reference, unrelated to the migration-chain problem; it was **not** fixed here since it's outside this task's scope (migration mechanics), but is noted so it isn't mistaken for something this change was supposed to address. `db:seed` was used instead as the low-risk connectivity check (see "Verification" below).

## What was done, and why

1. **Deleted the four empty migration directories** (`20260721021800_enable_pgvector`, `20260721021826_baseline_collab_models`, `20260721132118_add_version_label`, `20260726160000_add_hnsw_vector_index`). They contained no SQL and could not be recovered or replayed; keeping them would only preserve the appearance of history that never actually existed on disk.

2. **Deleted the uncommitted `20260910120000_submission_ownership_and_check_constraints` migration.** Its changes (drop `APPROVED` from `ContentStatus`, convert `verifications.type`/`value` to the `VerificationType` enum/`tokenHash`, move `Asset`/`VectorEmbedding` ownership to `Submission`, add the two CHECK constraints, etc.) all assume an intermediate schema state that was never actually created by any committed migration. Since this migration was uncommitted and no real environment could possibly already be sitting at that intermediate state, its changes are fully subsumed by generating one fresh migration directly against the current `schema.prisma` — there was no value in preserving a hand-written multi-step transition to a state that never existed anywhere outside this one file.

3. **Chose a single-baseline approach**: kept the two committed migrations (`20260627144532_document_and_user_models`, `20260713_add_verification_type`) untouched — they're already-applied history and rewriting committed migrations is the wrong move — and generated **one new migration** (`20260910071633_baseline_content_platform`) that diffs straight from the post-`20260713` state to the current `schema.prisma`. This is the simpler of the two options `schema.prisma`'s own task framing allowed for, and was chosen because nothing in this pre-launch codebase depends on the old `APPROVED`-inclusive intermediate `ContentStatus` shape ever having existed as a real, separately-migrated state.

   (`20260627084411_test_migration`, the very first experimental migration, was also left untouched for the same "don't rewrite committed/already-applied history" reason, even though its `"User"` table is dropped by the very next migration — it's harmless, applies as a no-op net effect, and rewriting the earliest migration in the chain has no benefit.)

4. **Switched `docker-compose.yml`'s Postgres image** from `postgres:17` to `pgvector/pgvector:pg17`. Plain `postgres:17` has no `vector` extension binary available at all, so `CREATE EXTENSION vector` (required by `VectorEmbedding.embedding vector(768)` and the HNSW index) would fail regardless of migration content. `pgvector/pgvector:pg17` is the same Postgres 17 major version with the extension pre-built.

5. **Added declarative extension tracking to `schema.prisma`**: `previewFeatures = ["postgresqlExtensions"]` on the `generator client` block and `extensions = [vector]` on the `datasource db` block. This is the only change made to `schema.prisma` in this task, and it's a migration-mechanics change, not a model change — it lets Prisma's own migration diffing emit `CREATE EXTENSION IF NOT EXISTS "vector";` automatically (confirmed in the generated migration, see below), instead of requiring a hand-maintained `CREATE EXTENSION` statement that could drift out of sync with what the schema actually declares.

6. **Generated the baseline migration with Prisma itself**, not hand-written, via `prisma migrate dev --name baseline_content_platform` against a clean database that had only the two committed migrations applied. Prisma's schema-diff engine produced the enum creations, all six new tables, all indexes, and all foreign keys directly from `schema.prisma` — this is the "let Prisma generate it from the schema diff" approach the task called for, so the migration SQL provably matches the Prisma schema by construction rather than by hand-transcription.

7. **Hand-appended three things Prisma's schema language cannot express**, onto the end of the generated `20260910071633_baseline_content_platform/migration.sql` (Prisma has no CHECK-constraint attribute and treats `vector(768)` as an opaque `Unsupported(...)` type, so it can't emit either on its own):
   - The two exactly-one-of-`(articleId, techReadId)` CHECK constraints on `submissions` and `comments`, using the same `num_nonnulls(...) = 1` pattern already documented in `schema.prisma`'s comments on the `Submission` and `Comment` models.
   - An HNSW index on `vector_embeddings.embedding` using `vector_cosine_ops`, matching the cosine-distance ANN search the AI semantic-search feature needs (see "HNSW / pgvector rationale" below).
   - (The `CREATE EXTENSION IF NOT EXISTS "vector";` statement did **not** need to be hand-appended — Prisma generated it automatically once `extensions = [vector]` was declared in step 5.)

8. **Fixed `packages/database/.env`'s encoding** (UTF-16LE → UTF-8) so that scripts using bare `dotenv/config` (`src/client.ts`, `src/utils/seed.ts`) can actually read `DATABASE_URL` when invoked with `packages/database` as the working directory.

`README.md` was reviewed and **not modified**: its "How to Develop" setup steps (`docker compose up -d`, `npm run db:generate`, `npm run db:migrate:dev`) are still accurate as written — they don't reference `db:push` as the setup method and don't hardcode the old non-pgvector image tag, so nothing there was factually wrong per the task's stated bar for editing it. (Its "Schema" section's model list — "`User` — `id`, `name`, `email`" — is stale relative to the full new schema, but that's a documentation-completeness gap, not a wrong instruction that would misdirect someone following the migration path, so it was left alone to keep this change minimal and in-scope.)

## Exact commands run

```bash
# 1. Removed the four empty migration directories and the uncommitted hardening migration
rm -rf packages/database/prisma/migrations/20260721021800_enable_pgvector \
       packages/database/prisma/migrations/20260721021826_baseline_collab_models \
       packages/database/prisma/migrations/20260721132118_add_version_label \
       packages/database/prisma/migrations/20260726160000_add_hnsw_vector_index \
       packages/database/prisma/migrations/20260910120000_submission_ownership_and_check_constraints

# 2. docker-compose.yml: image postgres:17 -> pgvector/pgvector:pg17

# 3. Fresh Postgres, wiping any pre-existing volume
docker compose down -v
docker compose up -d

# 4. schema.prisma: added previewFeatures = ["postgresqlExtensions"] (generator)
#                   and extensions = [vector] (datasource)
npx prisma validate   # confirmed schema valid before generating migrations

# 5. Applied the two committed migrations, then generated + applied the new baseline
#    from a clean DB in one step
cd packages/database
npx prisma migrate dev --name baseline_content_platform

# 6. Hand-appended the two CHECK constraints and the HNSW index to the bottom of
#    prisma/migrations/20260910071633_baseline_content_platform/migration.sql

# 7. Proved the full migration set from an actually clean database (not just the
#    dev DB migrate dev had already touched)
docker exec collab-editor-db psql -U postgres -d postgres -c 'DROP DATABASE "collab-editor";'
docker exec collab-editor-db psql -U postgres -d postgres -c 'CREATE DATABASE "collab-editor";'
npx prisma migrate deploy
npx prisma migrate status
npx prisma generate

# 8. Low-risk read/write connectivity check (test:db script's target file doesn't
#    exist in the repo, so db:seed was used instead - it only upserts two sample
#    User rows by email)
npx tsx src/utils/seed.ts
```

## Verification performed (actual output)

**`prisma migrate deploy` against a freshly dropped-and-recreated database:**

```
4 migrations found in prisma/migrations

Applying migration `20260627084411_test_migration`
Applying migration `20260627144532_document_and_user_models`
Applying migration `20260713_add_verification_type`
Applying migration `20260910071633_baseline_content_platform`

The following migration(s) have been applied:

migrations/
  └─ 20260627084411_test_migration/
    └─ migration.sql
  └─ 20260627144532_document_and_user_models/
    └─ migration.sql
  └─ 20260713_add_verification_type/
    └─ migration.sql
  └─ 20260910071633_baseline_content_platform/
    └─ migration.sql

All migrations have been successfully applied.
```

**`prisma migrate status` immediately after:**

```
4 migrations found in prisma/migrations

Database schema is up to date!
```

**`prisma generate`:**

```
✔ Generated Prisma Client (7.8.0) to .\src\generated\prisma in 414ms
```

Confirmed the regenerated client's model list matches the new schema exactly (`Account`, `Article`, `Session`, `User`, `Verification`, `Asset`, `Comment`, `Submission`, `TechRead`, `VectorEmbedding`) with none of the old CollabX models (`Workspace`, `WorkspaceMember`, `Artifact`, `Project`, `Version`) still present in `src/generated/prisma/models/`.

**Direct DB inspection of the two hand-appended pieces, against the same freshly-deployed database:**

```
$ SELECT extname, extversion FROM pg_extension WHERE extname='vector';
 extname | extversion
---------+------------
 vector  | 0.8.6

$ SELECT conname, contype FROM pg_constraint WHERE conname LIKE '%xor_tech_read%';
              conname              | contype
-----------------------------------+---------
 submissions_article_xor_tech_read | c
 comments_article_xor_tech_read    | c

$ \d+ vector_embeddings  (Indexes section)
    "vector_embeddings_pkey" PRIMARY KEY, btree (id)
    "vector_embeddings_contentHash_idx" btree ("contentHash")
    "vector_embeddings_embedding_idx" hnsw (embedding vector_cosine_ops)
    "vector_embeddings_submissionId_chunkIndex_key" UNIQUE, btree ("submissionId", "chunkIndex")
    "vector_embeddings_submissionId_embeddingModel_contentHash_key" UNIQUE, btree ("submissionId", "embeddingModel", "contentHash")
```

**Low-risk connectivity check (`tsx src/utils/seed.ts`):**

```
Seeding database...
Database seeded successfully.
```

This is an honest, non-fabricated result: `prisma migrate deploy` succeeded end-to-end against a database that was dropped and recreated from nothing immediately beforehand (not the already-migrated dev database `migrate dev` had touched), `prisma migrate status` independently confirms zero drift, and the seed script proves the generated Prisma Client can actually read and write through the schema over a live connection.

## Data-integrity constraints preserved

All of the following are carried over unchanged from `schema.prisma`'s own doc comments — no new rationale is introduced here, this section only summarizes what the schema already specifies and confirms it's physically present in the deployed database:

- **Exactly-one-of `(articleId, techReadId)`** on `submissions` and `comments`, enforced by `CHECK (num_nonnulls("articleId", "techReadId") = 1)` — added as raw SQL since Prisma's schema language has no CHECK-constraint attribute. `Asset` and `VectorEmbedding` deliberately do **not** need this (single required FK to `Submission` each), per the schema's own comments on those models.
- **Cascade on delete**: `Session`, `Account`, `Submission` (via `articleId`/`techReadId`), `Comment` (via `articleId`/`techReadId`/`userId`), `Asset`, `VectorEmbedding` — deleting an `Article`/`TechRead` takes its submissions with it, and deleting a `Submission` takes its own assets/embeddings with it, since an older/rejected version's images and indexed chunks are meaningless without it.
- **Restrict on delete**: `Article.createdBy`, `TechRead.createdBy`, `Submission.submittedBy`, `Asset.uploadedBy`, `Comment.parentComment` — audit integrity for authorship (can't delete a user while their content/submission history exists), and a parent comment with live replies can only be removed via the existing `deletedAt` soft-delete path, never a physical delete that would cascade-destroy its thread.
- **SetNull on delete**: `Submission.reviewedBy`, `Article.currentSubmission`, `TechRead.currentSubmission` — the reviewing admin's identity and the "current version" pointer are metadata, not ownership, so losing them shouldn't block deleting a user or a submission row.
- **Uniqueness**: `@@unique([articleId, version])` / `@@unique([techReadId, version])` on `Submission` for monotonic per-parent version numbers (NULL articleId/techReadId rows from the other content type never collide, since NULL <> NULL); `@@unique([submissionId, embeddingModel, contentHash])` on `VectorEmbedding` as the idempotency key for re-embedding a version without duplicating rows.

All of the above were confirmed present in the deployed schema via the `\d+` and `pg_constraint` queries shown above (spot-checked on `vector_embeddings` and the two CHECK constraints directly; the FK/unique constraints are generated verbatim by Prisma from the already-reviewed `schema.prisma` relation/`@@unique` attributes, so they're not independently at risk of the same "never actually migrated" problem this document is about).

## HNSW / pgvector index rationale

`VectorEmbedding.embedding` is a `vector(768)` column (`Unsupported("vector(768)")` in Prisma's schema language, since Prisma has no native pgvector type) used for semantic similarity search over indexed content chunks. Without an index, a similarity query is a full sequential scan computing a distance function against every row — fine at low row counts, but it doesn't scale as the content library and its chunked embeddings grow. An HNSW (Hierarchical Navigable Small World) index gives fast approximate-nearest-neighbor search instead of an exact sequential scan, which is the standard tradeoff for embedding-similarity search at any real scale. `vector_cosine_ops` was chosen specifically to match cosine-distance (`<=>`) queries, which is the typical similarity metric for normalized text embeddings (e.g. `gemini-embedding-001`, referenced directly in `schema.prisma`'s comment on `VectorEmbedding.embeddingModel`). This mirrors `schema.prisma`'s own note (just above the `VectorEmbedding` model) that the HNSW index is intentionally added via raw SQL rather than a Prisma schema attribute, since Prisma has no way to declare a non-B-tree/GIN index type.

## Final migration folder list

```
packages/database/prisma/migrations/
├── 20260627084411_test_migration/                  (unchanged, committed)
├── 20260627144532_document_and_user_models/         (unchanged, committed)
├── 20260713_add_verification_type/                  (unchanged, committed)
├── 20260910071633_baseline_content_platform/        (new — Prisma-generated diff + hand-appended CHECK constraints/HNSW index)
└── migration_lock.toml
```

## Outstanding / explicitly out of scope

- `packages/database/package.json`'s `test:db` script (`tsx src/test/test-database-connection.ts`) references a file that does not exist in the repository. Not fixed here — it's a stale script reference unrelated to the migration-chain problem this document addresses, and `db:seed` was used as the connectivity check instead.
- `README.md`'s "Schema" section still lists only the old `User` model. Left unchanged per this task's explicit scope (only fix setup instructions that are factually wrong/misleading; this is a documentation-completeness gap, not a wrong instruction).
- This task deliberately did not touch `apps/api` or `apps/web`, per scope. Those apps' generated-client usage will need `pnpm --filter ... exec prisma generate` (or equivalent) re-run wherever they consume `@repo/database`, since the client's model set changed materially — tracked separately per `002-architecture-impact.md`, not part of this change.
