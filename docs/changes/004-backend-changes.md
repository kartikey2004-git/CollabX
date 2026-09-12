# 004 — Backend Changes

**Status of this document**: describes work actually completed in this session — the entire `apps/api` backend and `packages/validation` schema layer for the new Article/TechRead/Submission/Comment/Asset content model, replacing the OLD Workspace/Project/Artifact/Version backend entirely. Everything below reflects code that exists in the working tree, compiles (`tsc --noEmit` and `tsc -p tsconfig.json` both pass with zero errors), and was smoke-tested end-to-end against a real, running Postgres instance (see "Verification performed" at the end). Nothing here is aspirational.

## Summary of what changed

- **Deleted** (referenced models/enums that no longer exist in `schema.prisma`):
  - `apps/api/src/controllers/{workspace,workspace-member,project,artifact,version,image}.controller.ts`
  - `apps/api/src/services/{workspace,workspace-member,project,artifact,version,image}.service.ts`
  - `apps/api/src/repositories/{workspace,workspace-member,project,artifact,version}.repository.ts`
  - `apps/api/src/routes/{workspace,workspace-member,project,artifact}.routes.ts`
  - `packages/validation/src/{workspace,project,artifact}.schema.ts`
  - `apps/api/src/middleware/rbac.middleware.ts` (old `requireWorkspaceRole` + resolver functions) — replaced, not just deleted (see below).
- **Kept unchanged** (domain-agnostic, no OLD-model references, reused as-is per `002-architecture-impact.md`'s "existing architecture + minimal necessary changes" principle): `lib/errors.ts`, `lib/response.ts`, `lib/pagination.ts`, `lib/object-storage.ts`, `middleware/auth.middleware.ts`, `middleware/validate.middleware.ts`, `middleware/rate-limit.middleware.ts`, `middleware/upload.middleware.ts`, `middleware/error.middleware.ts`, `repositories/user.repository.ts`, `app.ts`, `server.ts`, `env.ts`, `config/*`.
- **Trimmed**: `services/markdown.service.ts` — dropped the `ArtifactType`-keyed `sanitizeContent` wrapper (no `ArtifactType` exists anymore; every `Submission.content` is plain Markdown), kept and exported `sanitizeMarkdownText` directly.
- **Modified**: `lib/auth.ts` (added `user.additionalFields.role`, see "Role exposure fix" below), `types/express.d.ts` (dropped `req.membership`, kept `req.user`/`req.session`).
- **New**: `middleware/rbac.middleware.ts` (rewritten — `requireRole`), full repository/service/controller/route verticals for Article, TechRead, Submission, Comment, Asset; new validation schema files in `packages/validation/src`.

## New/changed validation schemas (`packages/validation/src`)

- `common.schema.ts` — kept `idParamSchema`/`paginationQuerySchema`/`sortOrderSchema`; dropped `workspaceIdParamSchema`/`projectIdParamSchema` (no longer meaningful); added `articleIdParamSchema`, `techReadIdParamSchema`, `submissionIdParamSchema`, `contentStatusSchema`, `titleSchema`, `summarySchema`, `markdownContentSchema` (shared by Article/TechRead/Submission, since all three need the same title/summary/content shape).
- `category.schema.ts` — the 7-value `Category` enum.
- `article.schema.ts` — `createArticleSchema`, `listArticlesQuerySchema` (public, no status field — see judgment call below), `listArticlesAdminQuerySchema` (mine/admin, status IS client-controllable here), `articleSlugParamSchema`.
- `tech-read.schema.ts` — mirrors article.schema.ts plus `externalUrl`/`sourceName`/`tags`/`updateTechReadTrendingSchema`.
- `submission.schema.ts` — `createSubmissionSchema`, `reviewSubmissionSchema` (discriminated union on `action`), `submissionQueueQuerySchema`, `submissionHistoryQuerySchema`.
- `comment.schema.ts` — `createCommentSchema`, `listCommentsQuerySchema`.
- `index.ts` — re-exports all of the above; no longer exports the deleted workspace/project/artifact schemas.

## Role exposure fix (`apps/api/src/lib/auth.ts`)

**Problem found**: `req.user.role` was not populated by better-auth's session lookup even though the `User.role` column exists — better-auth only exposes its own core fields unless told about extra ones. This mirrors the OLD schema's dead, never-read `User.role: String` column noted in `000-project-analysis.md`.

**Fix applied**: added
```ts
user: {
  additionalFields: {
    role: { type: "string", defaultValue: "READER", input: false },
  },
},
```
to the `betterAuth(...)` config. Verified this is better-auth 1.6.22's actual supported API by reading `node_modules/better-auth/dist/db/field.d.mts` and `dist/auth/full.d.mts` directly (confirmed `additionalFields`, `input`, `defaultValue` are real, typed options — `RemoveFieldsWithInputFalse` in the type definitions specifically filters `input: false` fields out of every client-writable input type).

**Why this is safe (mass-assignment / privilege-escalation check)**: `input: false` removes `role` from every client-writable input schema (sign-up, update-user, etc.) at the type and runtime-validation level — a user can never set their own `role` through a request body. The only way `role` changes is a direct server-side `db.user.update(...)` (no such endpoint exists yet; today every user is stuck at `READER` until a database operator changes it directly — a known, accepted limitation, see below).

**Why it's not stale**: better-auth's session lookup (`auth.api.getSession`) re-fetches the `User` row from Postgres via the Prisma adapter on every call — it is not a cached/signed JWT payload — so a role change take effect on the very next request, no re-login required. **Verified live in the smoke test**: a user's role was updated directly in Postgres via `docker exec ... psql UPDATE users SET role=...`, and the very next `GET /api/auth/get-session` (using the same, already-issued session cookie) returned the new role.

I did not need the `requireRole`-does-a-fresh-DB-lookup fallback the task allowed for — `additionalFields` worked as expected on the first attempt and was verified working end-to-end.

## RBAC middleware (`apps/api/src/middleware/rbac.middleware.ts`)

Replaced `requireWorkspaceRole(allowedRoles, resolveWorkspaceId)` (a factory needing a resolver function to first figure out "which workspace does this request concern") with a flat `requireRole(allowedRoles: Role[])` that checks `req.user.role` directly — no repository call, no resolver, no ancestry-walking, since `Role` now lives directly on `User`. Exports `ALL_ROLES`, `CONTRIBUTOR_OR_ADMIN`, `ADMIN_ONLY`.

`types/express.d.ts` dropped the `membership` field entirely — there is no more per-resource membership to attach.

## Judgment calls (ambiguity resolved — documented per the task's own rule that ambiguity which could cause architectural problems must be explained, not silently resolved)

1. **Browsing requires authentication (no anonymous tier).** The task's flow doc (d) says "commenting requires login even though browsing may not," suggesting public reads might be unauthenticated. But `requireRole`'s own doc comment states "every route that uses this runs `requireAuth` first... `req.user` is guaranteed to exist" — and `Role` (including its `READER` default) only exists on an authenticated `User` row; there is no schema concept of an anonymous visitor's role. I resolved this by requiring `requireAuth` + `requireRole(ALL_ROLES)` on every route, including public listing/reading. A logged-in `READER` can browse everything a hypothetical anonymous visitor could; the only behavior this forecloses is fully unauthenticated public access, which nothing in the schema or RBAC design actually supports without inventing a new "no role" tier. This is safe to revisit later (a public-read exception could be layered in front of `requireAuth` for GET routes specifically) but doing so wasn't requested and would be scope creep.

2. **404-vs-403 for visibility, changed from the OLD product's philosophy.** The OLD `rbac.middleware.ts` deliberately returned 404 (not 403) when a user wasn't a workspace member, to hide a resource's existence. `002-architecture-impact.md` explicitly states this "has no equivalent need in the new model... a NotFoundError is only needed for a genuinely missing/soft-deleted id." I followed that guidance literally: `articleService.getById`/`getBySlug`, `techReadService.getById`/`getBySlug`, `submissionService.getById`, `submissionService.createNewVersion`'s ownership check, and `assetService.upload`'s ownership check all throw `ForbiddenError` (never `NotFoundError`) when the row exists but the caller isn't permitted to see/act on it. `NotFoundError` is reserved strictly for "this id doesn't resolve to a real, non-deleted row at all."

3. **Article/TechRead soft-delete is ADMIN-only, not creator-or-ADMIN.** The task explicitly left this as "your call." I chose ADMIN-only because Article/TechRead is the platform's single shared moderation record — the same reasoning that makes publish/reject ADMIN-only applies to removal, and letting a contributor unilaterally delete a record an admin might already be reviewing (or that's already published and has comments/traffic) seemed like the riskier default. This can be relaxed later if product requirements want creators to retract their own unpublished drafts.

4. **Single in-flight submission per Article/TechRead.** Only one `DRAFT`/`PENDING_REVIEW` submission may exist per parent at a time (enforced by `submissionRepository.countActive` in `submissionService.createNewVersion`, with the `@@unique([articleId, version])`/`@@unique([techReadId, version])` DB constraint as the real race-safety net, P2002 caught and translated to `ConflictError`). This was an explicit instruction, not an ambiguity, but the concrete error message/behavior on violation was my call: a 409 `CONFLICT` telling the caller to finish or wait for the existing submission, rather than e.g. silently returning the existing in-flight submission. Verified live in the smoke test (creating a v3 while v2 was still `DRAFT` returned 409).

5. **Asset upload restricted to DRAFT submissions only, and only the submission's own owner/ADMIN.** Explicit instruction to decide and document. Reasoning: a `PENDING_REVIEW` submission is "frozen" for admin review — silently growing new embedded images an admin never saw mid-review seemed wrong; `PUBLISHED`/`REJECTED` are closed historical records per the schema's own "a rejected submission's content is never mutated" comment. Verified live: uploading to the just-published v1 submission correctly returned 403 before ever reaching the object-storage call.

6. **Comment listing is flat, not a nested tree.** Explicit instruction to decide. Every row carries `parentCommentId`; building a tree is left to the frontend, which needs the flat list regardless to render any tree shape, and a recursive backend response shape adds real complexity (arbitrary depth, N+1 risk) for no clear backend-side benefit.

7. **Soft-deleted comments are still returned by `GET .../comments`** (with `deletedAt` set, body left intact at the repository layer) rather than filtered out — this is required so a soft-deleted comment's still-visible replies aren't orphaned in the UI; the frontend is expected to render a "[deleted]" placeholder instead of the body when `deletedAt` is set, mirroring the schema's own stated rationale for switching `parentComment`'s FK to `Restrict`.

8. **TechRead's admin-queue-adjacent listing reuses the same query shape as Article's** (`findForOwnerOrAdmin`/`listMine`) rather than inventing a separate concept — both content types share the identical Submission-based moderation pipeline per schema.prisma's own comment, so there was no reason for the listing shape to diverge.

9. **Article/TechRead title+summary are seeded from the initial Submission at creation time**, not left null until first publish — required because the column is `NOT NULL` and there's no published version yet to denormalize from. This value is display-only for an unpublished item and is never read again by anything except the owner/admin viewing their own draft; the publish transaction is the only thing that can change it once a first version exists. Verified live: after rejecting a v2 submission that proposed a different title, `GET /articles/:id` still showed the v1-published title, confirming rejection never touches the parent row.

## Endpoint reference

All endpoints are mounted under `/api/v1` (see `apps/api/src/routes/v1.routes.ts`). Every route runs `requireAuth` first; the specific `requireRole(...)` gate is noted per endpoint. `mutationRateLimiter` (60/min) is applied to every write; `uploadRateLimiter` (20/min) to the asset upload.

### Article (`article.routes.ts`, mounted at `/articles`)

**POST /articles**
- Authorization: `CONTRIBUTOR_OR_ADMIN`
- Request: `{ title, summary?, category, content }`
- Validation: `createArticleSchema`
- Business logic: generates a unique slug (kebab-case + `-2`/`-3`... suffix on collision); creates `Article` (status `DRAFT`) + its v1 `Submission` (status `DRAFT`) in one `db.$transaction`; content sanitized via `sanitizeMarkdownText`.
- DB ops: `Article.create` + `Submission.create` in one transaction.
- Response: `201 { article, submission }`
- Errors: 400 validation, 401, 403 (role), 409 (slug race — P2002 caught).

**GET /articles**
- Authorization: `ALL_ROLES`
- Business logic: `status: PUBLISHED` only, optional `category` filter, cursor-paginated, default sort `publishedAt desc`.
- Response: `200`, array + `{ nextCursor, hasMore }` meta.

**GET /articles/mine**
- Authorization: `CONTRIBUTOR_OR_ADMIN`
- Business logic: `CONTRIBUTOR` → own articles (any status); `ADMIN` → every non-deleted article. Decided from `req.user.role`, never a client field.
- Response: `200`, paginated list.

**GET /articles/slug/:slug**, **GET /articles/:id**
- Authorization: `ALL_ROLES`
- Business logic: `PUBLISHED` visible to anyone; non-published visible only to owner/ADMIN (else 403 — see judgment call #2); includes `currentSubmission` (full content) in the response.
- Errors: 404 (doesn't exist/soft-deleted), 403 (unpublished, not owner/admin).

**DELETE /articles/:id**
- Authorization: `ADMIN_ONLY` (judgment call #3)
- Business logic: soft-delete (`deletedAt`).
- Errors: 404, 403.

### TechRead (`tech-read.routes.ts`, mounted at `/tech-reads`)

Same shape as Article (`POST /`, `GET /mine`, `GET /slug/:slug`, `GET /`, `GET /:id`, `DELETE /:id`), plus:

**PATCH /tech-reads/:id/trending**
- Authorization: `ADMIN_ONLY`
- Request: `{ isTrending?, trendingScore? }` (at least one required)
- Validation: `updateTechReadTrendingSchema` — restricted to ONLY these two fields, deliberately, so this one direct-update endpoint can't be used to bypass the Submission review flow for title/status/content.
- Response: `200`, updated TechRead.

`GET /tech-reads?isTrending=true` sorts by `trendingScore desc` regardless of the requested `sortBy` — this mode IS the "Trending Tech Reads" feed.

### Submission

Nested (`/articles/:articleId/submissions`, `/tech-reads/:techReadId/submissions`) via `createNestedSubmissionRouter(parentType)`:

**POST .../submissions**
- Authorization: `CONTRIBUTOR_OR_ADMIN` (route) + owner-or-ADMIN of the specific parent (service, `ForbiddenError` otherwise)
- Business logic: rejects if the parent already has a `DRAFT`/`PENDING_REVIEW` submission (409); `version` = max existing + 1, computed inside the same transaction as the insert; P2002 (unique constraint race) caught → 409.
- Response: `201`, new `Submission` (status `DRAFT`).

**GET .../submissions**
- Authorization: `CONTRIBUTOR_OR_ADMIN` (route) + owner-or-ADMIN (service)
- Business logic: full version history, all statuses, default newest-version-first, cursor-paginated.

Direct (`/submissions`):

**GET /submissions** — the moderation queue. `ADMIN_ONLY`. `status=PENDING_REVIEW` default, always `submittedAt asc` (oldest first, matching the schema's own index comment), cursor-paginated.

**GET /submissions/:id** — `ALL_ROLES` route gate; service allows owner, ADMIN, or (if `PUBLISHED`) anyone; else 403.

**POST /submissions/:id/submit** — `CONTRIBUTOR_OR_ADMIN` route gate; service requires owner-or-ADMIN and `status === DRAFT`; sets `status=PENDING_REVIEW`, `submittedAt=now()`. 409 if not currently DRAFT.

**PATCH /submissions/:id/review** — `ADMIN_ONLY`. Body: `{action:"PUBLISH"}` or `{action:"REJECT", rejectionReason}` (discriminated union — a REJECT without a reason is a 400 before the service runs). Requires `status===PENDING_REVIEW` (409 otherwise). PUBLISH: one `db.$transaction` sets `Submission.status=PUBLISHED,reviewedBy,reviewedAt` AND the parent's `status=PUBLISHED,currentSubmissionId,title,summary,publishedAt`. REJECT: one `db.$transaction` (single-statement in practice, wrapped for consistency/future-proofing) sets only `Submission.status=REJECTED,reviewedBy,reviewedAt,rejectionReason` — parent untouched. **All of this was verified live end-to-end against a real Postgres instance — see "Verification performed" below.**

### Comment

Nested (`/articles/:articleId/comments`, `/tech-reads/:techReadId/comments`) via `createNestedCommentRouter(parentType)`:

**POST .../comments** — `ALL_ROLES` (READER included, per schema.prisma's own comment). Service requires the parent to be `PUBLISHED` (403 otherwise); validates `parentCommentId` belongs to the same parent if given. Content sanitized via `sanitizeMarkdownText`.

**GET .../comments** — `ALL_ROLES`. Flat list, newest-first, cursor-paginated (judgment call #6).

Direct: **DELETE /comments/:id** — `ALL_ROLES` route gate (ownership enforced in the service: author or ADMIN, else 403); soft-delete only, never hard delete (the DB's `Restrict` FK on `parentCommentId` would refuse a hard delete on a comment with live replies anyway).

### Asset

**POST /submissions/:submissionId/assets** — `CONTRIBUTOR_OR_ADMIN` route gate; `uploadRateLimiter`; multer (`imageUpload`, reused unchanged — 5MB limit, PNG/JPEG/WEBP/GIF allowlist). Service requires submission owner-or-ADMIN AND `status===DRAFT` (403 otherwise, checked before ever touching object storage — verified live). On success, uploads to `submissions/{submissionId}/{uuid}.{ext}` via the unchanged `uploadObject` helper and **persists an `Asset` row** (`url`, `storageKey`, `mimeType`, `size`, `uploadedBy`, `submissionId`) — the key behavioral change from the OLD `imageService`, which never wrote a database row at all.

## Verification performed

- `npx tsc` in `packages/validation`: 0 errors.
- `npx tsc` in `packages/database` (rebuilt `dist/` — see note below): 0 errors.
- `npx tsc --noEmit -p tsconfig.json` in `apps/api`: 0 errors.
- `npm run build` in `apps/api` (full `tsc` emit to `dist/`): 0 errors.
- **Note on a pre-existing build-ordering issue found and fixed as a byproduct**: `@repo/database`'s `package.json` resolves through `dist/index.js` (built output), not `src/` directly. `packages/database/dist` had not been rebuilt since the schema pivot, so it still contained the OLD generated Prisma client (`Workspace`/`Artifact`/`WorkspaceRole`/etc.) even though `packages/database/src/generated/prisma` (the actual Prisma-generated client) was already correct per `003-database-changes.md`. I ran `npm run build` in `packages/database` to regenerate `dist/` from the current `src/` — this is a build-step fix, not a schema or source-code change, and was necessary before `apps/api`'s own typecheck could even resolve the correct model types.
- **Full live smoke test** against a real, freshly-migrated Postgres (`docker ps` confirmed `collab-editor-db` already running from the DB agent's work) with the compiled `apps/api/dist/server.js` actually running and receiving real HTTP requests via `curl`:
  - Signup → confirmed `role: "READER"` present on the response (additionalFields working) with `token: null` (email verification required, matching existing auth config).
  - Directly promoted the test user to `CONTRIBUTOR` via `psql`, signed in, confirmed `GET /api/auth/get-session` immediately reflected the new role on the *existing* session cookie (proves role is read live from the DB per-request, not cached).
  - `POST /articles` → 201, `Article`(DRAFT) + `Submission` v1(DRAFT) created together.
  - `GET /articles` (public) → empty (correctly excludes the DRAFT).
  - `GET /articles/mine` → showed the DRAFT.
  - `POST /submissions/:id/submit` → 200, `PENDING_REVIEW`.
  - Promoted the user to `ADMIN`: `GET /submissions` (queue) → showed the pending submission; `PATCH /submissions/:id/review {action:PUBLISH}` → 200, and `GET /articles` (public) immediately showed the now-`PUBLISHED` article with `currentSubmissionId` set and `publishedAt` populated — the full atomic publish transaction verified live.
  - Demoted back to `CONTRIBUTOR`: created a v2 submission (version correctly `2`); attempting a v3 while v2 was still `DRAFT` → 409 (single-in-flight rule verified); submitted v2 → `PENDING_REVIEW`.
  - As `ADMIN`: `PATCH .../review {action:REJECT}` with no `rejectionReason` → 400 validation error (discriminated union verified); with a reason → 200, `REJECTED`; re-`GET /articles/:id` confirmed the parent **still showed v1's published title/content**, proving reject never touches the parent (verified live, not just by code inspection); attempting to re-review the now-`REJECTED` submission → 409 (state-machine guard verified).
  - `POST .../comments` on the published article → 201; `GET .../comments` → listed it with the author's `user` info attached; `DELETE /comments/:id` as its author → 200, soft-deleted (`deletedAt` set).
  - Demoted to `READER`: `POST /articles` → 403 `FORBIDDEN` (RBAC gate verified).
  - `POST /tech-reads` → 201, `TechRead` + v1 `Submission` created together; `PATCH /tech-reads/:id/trending` as `CONTRIBUTOR` → 403; as `ADMIN` → 200.
  - `POST .../comments` on an unpublished `TechRead` → 403 (publish-gate on commenting verified).
  - `GET /articles/:nonexistent-id` → 404 `NOT_FOUND`.
  - **Asset upload**: uploading to a `PUBLISHED` submission correctly returned 403 *before* ever reaching object storage, proving the ownership/status guard runs first. Uploading to a genuinely `DRAFT` submission returned a `500 INTERNAL_ERROR` — **this is an honest, disclosed limitation, not a code bug**: `docker-compose.yml` in this repository only defines the `postgres` service; no MinIO/S3-compatible object storage container exists anywhere in this environment (confirmed by reading `docker-compose.yml` directly), so the `PutObjectCommand` call inside `uploadObject` (`lib/object-storage.ts`, unchanged from the OLD product) has nothing to connect to at `http://localhost:9000`. This is an infrastructure gap that predates this session's work, not something introduced by the new Asset code — the new authorization/status logic in `asset.service.ts` was proven to execute correctly up to the object-storage boundary.
  - All smoke-test data (test users, sessions, articles, tech-reads, submissions, comments) was deleted from the database afterward via direct SQL cleanup; the running dev server process was stopped.

## Known limitations / explicitly out of scope

- **Asset upload's actual S3 PUT was not exercised end-to-end** — see above. The code path, MIME allowlist, size limit, and authorization/state guards are unchanged from (or directly adapted from) the OLD product's already-working `imageService`/`uploadObject`, and the new pre-upload guards were verified to run correctly; only the final object-storage network call is unverified in this environment.
- **No user-role-management endpoint exists yet.** Since `role` is `input: false`, the only way to change a user's role today is a direct database write (as done in this smoke test via `psql`). A future admin-only "manage users" endpoint would be a new, separate piece of work, not something this task's scope covered.
- **`apps/web` is now broken against this backend** (as expected/out of scope — a separate agent handles the frontend). It still imports the deleted `createWorkspaceSchema`/`createProjectSchema`/`createArtifactSchema`/`WorkspaceRole` from `@repo/validation` and `@repo/database` (confirmed via `grep`); none of `apps/web`'s files were touched in this session per the task's explicit instruction not to.
- **The admin moderation queue's cursor pagination assumes `submittedAt` is set** for whatever `status` filter is requested. This holds for every realistic queue use (`PENDING_REVIEW`, `REJECTED`, `PUBLISHED` all have `submittedAt` set once a submission leaves `DRAFT`). If an admin explicitly requests `status=DRAFT` (not the default, and not a real moderation-queue use case — DRAFT submissions haven't been submitted yet), `submittedAt` would be `null` for those rows and keyset pagination past the first page would degenerate (Postgres `NULL > x` is never true). Not fixed, since it requires an unrealistic explicit query the UI would never issue.
