# 008 — Final Summary

## Feature implemented

A full product pivot of the existing "CollabX" Workspace/Project/Artifact collaboration tool into an **engineering-knowledge-sharing platform**: contributors write Articles (original write-ups) and curate Tech Reads (annotated links to external resources), submit them through a versioned Submission review workflow, admins publish or reject each submission, and readers browse published content and leave threaded comments. Platform-wide RBAC (`ADMIN` / `CONTRIBUTOR` / `READER`) replaces the OLD per-workspace membership model entirely. This spanned the database schema, the entire `apps/api` backend, the `packages/validation` schema layer, and the entire `apps/web` frontend.

## Files changed

```text
Deleted (OLD Workspace/Project/Artifact/Version product — fully replaced, not partially kept):
- apps/api/src/controllers/{workspace,workspace-member,project,artifact,version,image}.controller.ts
- apps/api/src/services/{workspace,workspace-member,project,artifact,version,image}.service.ts
- apps/api/src/repositories/{workspace,workspace-member,project,artifact,version}.repository.ts
- apps/api/src/routes/{workspace,workspace-member,project,artifact}.routes.ts
- packages/validation/src/{workspace,project,artifact}.schema.ts
- apps/web/app/workspace/** (9 pages/layouts, the 3-level [workspaceId]/[projectId]/[artifactId] tree)
- apps/web/components/workspace/** (14 files: artifacts/, projects/, shared/, workspaces/)
- apps/web/hooks/{use-artifacts,use-projects,use-workspace-role,use-workspaces}.ts

Modified:
- apps/api/src/lib/auth.ts (role-exposure + anti-privilege-escalation fix — additionalFields.role, input:false)
- apps/api/src/middleware/rbac.middleware.ts (rewritten: requireWorkspaceRole -> flat requireRole)
- apps/api/src/routes/v1.routes.ts (mounts the new resource routers)
- apps/api/src/services/markdown.service.ts (dropped the ArtifactType-keyed wrapper)
- apps/api/src/services/comment.service.ts (this session's SEC-1 fix: redact deletedAt comment bodies)
- apps/api/src/types/express.d.ts (dropped req.membership)
- apps/web/app/(auth)/{login,signup}/page.tsx (redirect target /workspace -> /articles)
- apps/web/app/not-found.tsx, apps/web/app/globals.css, apps/web/middleware.ts, apps/web/package.json
- packages/database/prisma/schema.prisma (full model rewrite — see 003-database-changes.md)
- packages/validation/src/{common.schema,index}.ts
- docker-compose.yml (postgres:17 -> pgvector/pgvector:pg17)

Created — Backend (apps/api/src):
- controllers/{article,tech-read,submission,comment,asset}.controller.ts
- services/{article,tech-read,submission,comment,asset}.service.ts
- repositories/{article,tech-read,submission,comment,asset}.repository.ts
- routes/{article,tech-read,submission,comment,asset}.routes.ts

Created — Validation (packages/validation/src):
- article.schema.ts, category.schema.ts, comment.schema.ts, submission.schema.ts, tech-read.schema.ts

Created — Frontend (apps/web):
- app/(app)/layout.tsx, app/(app)/{articles,tech-reads}/{page,new/page,[slug]/page}.tsx
- app/(app)/dashboard/page.tsx, app/(app)/admin/review/{page,[submissionId]/page}.tsx
- components/layout/{site-header,nav-user}.tsx
- components/shared/{empty-state,status-badge,role-gate}.tsx
- components/content/{article-list,tech-read-list,article-detail,tech-read-detail,article-form,tech-read-form,markdown-view}.tsx
- components/comments/{comment-section,comment-item}.tsx
- components/dashboard/{my-content-list,my-content-row,new-version-dialog}.tsx
- components/admin/{review-queue-list,review-detail,trending-control}.tsx
- hooks/{use-current-user,use-role,use-articles,use-tech-reads,use-submissions,use-comments}.ts
- lib/{category-labels,content-types,query-string}.ts

Created — Database:
- packages/database/prisma/migrations/20260910071633_baseline_content_platform/migration.sql

Created — Documentation:
- docs/changes/{README,000..008}.md (this directory)
```

*(This list was generated from `git status --short --untracked-files=all` and `git diff --stat` run from the repo root in this session, not hand-typed from memory — 116 changed/untracked paths in total.)*

## Database changes summary

Full replacement of the `Workspace`/`WorkspaceMember`/`Project`/`Artifact`/`Version` model graph with `Article`, `TechRead`, `Submission` (the shared versioning/review engine both content types point at), `Comment` (threaded, soft-delete), and `Asset` (per-submission image uploads) — plus a platform-wide `Role` enum directly on `User` (replacing a dead, unread `String` column). `VectorEmbedding`/`IndexStatus` were carried over from the OLD schema for a planned future AI-search feature but have zero application code touching them today (confirmed by a repo-wide grep in this session — no controller/service/repository references either). Key integrity mechanisms: `CHECK (num_nonnulls(articleId, techReadId) = 1)` on `Submission`/`Comment` (raw SQL, no Prisma attribute exists for this), `Restrict` on `Comment.parentComment` (a parent with live replies can only be soft-deleted, confirmed by this session's live SQL test), `@@unique([articleId, version])`/`@@unique([techReadId, version])` for monotonic per-parent version numbers. One migration (`20260910071633_baseline_content_platform`) applied and confirmed working against a real Postgres instance. Full detail in `003-database-changes.md`.

## API changes summary

Platform-wide RBAC middleware (`requireRole`) replaced per-workspace membership checks. Every mutating route runs `requireAuth` → `requireRole(...)` → `mutationRateLimiter`/`uploadRateLimiter` → Zod `validate(...)` → controller → service (which performs the fine-grained ownership/state checks a role-group gate can't). Endpoints: Article/TechRead CRUD (create, list published, list mine, get by id/slug, soft-delete, TechRead's admin-only trending toggle), Submission (create new version, submit for review, list history, admin queue, admin publish/reject — the last wrapped in one atomic `db.$transaction` covering both the Submission and its parent), Comment (create/list/soft-delete, nested under Article/TechRead), Asset (upload, scoped to a DRAFT submission's own owner/ADMIN). Full endpoint-by-endpoint reference in `004-backend-changes.md`.

## Frontend changes summary

New `(app)` route group (`/articles`, `/tech-reads`, `/dashboard`, `/admin/review`) replaces the OLD 3-level `/workspace/[id]/[projectId]/[artifactId]` tree with a flat top-nav layout — there's no comparable nesting in the new content model. React Query hooks mirror the OLD `use-artifacts.ts` conventions (cursor pagination via `useInfiniteQuery`). Forms validate client-side against the same `@repo/validation` Zod schemas the backend uses. `RoleGate` provides permission-based UI (hide, don't just disable, actions a role can't perform) — confirmed in this session to be UX-only, backed by real server-side 403s. Markdown renders via `react-markdown` (no `dangerouslySetInnerHTML`); Mermaid fences render as plain code blocks (disclosed gap). Full detail in `005-frontend-changes.md`.

## Security summary

An independent security/RBAC review (`006-security-and-rbac.md`) live-tested IDOR, mass assignment, privilege escalation, state-machine enforcement, the atomic publish transaction, comment-thread integrity, rate limiting, and file-upload risk using real HTTP requests against a running API + Postgres, with three distinct real user accounts across all three roles. **Result: no IDOR, no mass-assignment vector, and no privilege-escalation path was found** — every cross-user access attempt (6 distinct vectors against another user's draft content, 1 against another user's comment) was rejected server-side with 403 using the correct ownership column, and a direct attempt to self-assign `role: "ADMIN"` at signup was confirmed live to be silently ignored (`input: false` on better-auth's `additionalFields.role`). **One real, medium-severity finding was found and fixed in this session**: soft-deleted comments' body text was still transmitted in full by `GET .../comments` (the "[deleted]" placeholder was frontend-only); `comment.service.ts::list` now redacts the body server-side for any comment with `deletedAt` set, verified live pre/post-fix. One low-severity finding (file-upload MIME check trusts client-declared Content-Type, no magic-byte sniffing) is documented as an accepted limitation, not fixed, since a proper fix is more than a one-line change.

## Testing summary

No automated test suite exists in this repository (none was introduced, matching the project's own convention). Validation was performed by live smoke-testing at every stage: the database-rebuild agent verified the migration against a real Postgres; the backend agent ran `tsc` clean and a full live create→submit→publish→reject→comment→RBAC-403 lifecycle against a running server; the frontend agent ran `tsc`/`next build`/`eslint` clean and, after a real browser click-through hit a sandbox memory limit, verified the frontend↔backend HTTP contract via curl instead; this session independently re-verified the highest-risk claims live (IDOR across two real distinct accounts, the role-mass-assignment block, live role-refresh without re-login, the atomic publish transaction, the Comment `Restrict` FK via a raw SQL delete attempt, and the SEC-1 fix pre/post). Full checklist in `007-testing-and-validation.md`.

## Known limitations

Being honest about everything not fully verified or intentionally out of scope, pulled together from every prior document:

- **No real browser click-through was ever completed**, by any agent, at any point in this session. `next dev` ran out of memory in this sandboxed environment after compiling one page. `next build`'s production compile succeeded and every hook's HTTP contract was verified via curl, but nobody clicked through the rendered UI.
- **Asset upload's actual S3 `PutObjectCommand` call was never exercised.** No MinIO/S3-compatible container exists in this environment's `docker-compose.yml`. Every guard *before* that call (ownership, submission status, MIME allowlist, size limit) was verified live.
- **No magic-byte file-content validation on uploads** — only the client-declared MIME type is checked (twice, defense-in-depth, but both checks trust the same header). Documented in `006-security-and-rbac.md` §10 as an accepted low-severity gap.
- **No in-app role-management endpoint.** The only way to promote a user (e.g. READER → CONTRIBUTOR) is a direct database write, exactly as used throughout this session's own testing. This fails closed (safe), not open, but is a real product gap.
- **Mermaid diagrams render as plain code blocks**, not live diagrams — `react-markdown` has no built-in Mermaid support and none was wired up.
- **No rich-text/WYSIWYG editor** — content is authored as plain Markdown in a `<Textarea>`, with no live preview and no image-upload-into-editor UI (the Asset upload endpoint has no frontend consumer at all).
- **The marketing landing page and `(auth)` pages' side-panel copy still say "CollabX"** and pitch the OLD product — not rewritten, out of scope for this pivot.
- **The reject → rejectionReason → "create new version" flow and the TechRead trending toggle** were reviewed by reading the code, not exercised live, by any agent in this session.
- **`my-content-row.tsx`'s per-row submission-history fetch is an accepted N+1-shaped tradeoff**, scoped intentionally to a small "my content" list; would need a batched endpoint if that list grows large.
- **Rate limiters use an in-memory store** — correct for a single server instance, would need a shared store (Redis) behind a load balancer. Pre-existing, not introduced by this feature.
- **Concurrent (simultaneously-fired, not sequential) request races were not tested** — e.g. two truly parallel "create new version" calls. The DB's `@@unique` constraint + P2002-catch is the documented safety net, but no `Promise.all`-style concurrent test was run.
- **Query performance at scale (index usage, `EXPLAIN ANALYZE`) was never measured** — all live testing used a handful of rows.

## Future improvements

Only genuinely useful, concretely-motivated items — no invented busywork:

- **A background job queue for AI-powered search/indexing.** `VectorEmbedding` and `IndexStatus` already exist in the schema (carried over from the OLD product's design) but have zero application code referencing them today (confirmed by grep in this session). A queue that, on submission publish, chunks the content, generates embeddings, and writes `VectorEmbedding` rows (flipping `Submission.indexStatus` through its existing enum states) would activate schema that's currently inert, without requiring any further schema change.
- **A magic-byte file-content check on asset uploads** (e.g. via a lightweight sniffing library), closing the low-severity gap documented in `006-security-and-rbac.md` §10 — a genuinely small, scoped addition to `asset.service.ts::upload`.
- **An admin-only "manage users" endpoint** to change a user's `Role` through the product itself instead of a direct database write — the natural next step now that `input: false` correctly blocks the insecure alternative (self-assignment).
- **A shared (Redis-backed) rate-limit store** if this API is ever deployed behind more than one server instance — not needed for a single-instance deployment, which is what exists today.

Not recommended as near-term work: a full marketing-copy rewrite of the landing page (cosmetic, disconnected from the shipped feature), Mermaid rendering (a real but purely-additive UX gap, not a defect), or a rich-text editor (an explicit non-goal per this task's own scope).
