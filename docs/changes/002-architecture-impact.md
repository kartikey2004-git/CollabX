# 002 — Architecture Impact Analysis

**Status of this document**: describes the PROPOSED architecture for the pivot. Nothing described under "Proposed architecture" exists in `apps/api`/`apps/web` yet — see `000-project-analysis.md` for what is actually implemented today, and `001-requirements-analysis.md` for the requirements this architecture must satisfy. This document only reasons about structure and reuse; it does not implement anything.

## Existing Architecture (summary — full detail in `000-project-analysis.md`)

The OLD product is a strict layered Express/Prisma app:

```
apps/web (Next.js, React Query hooks → apps/web/lib/api-client.ts)
   ↓ HTTP + cookies
apps/api/src/app.ts (cors → pino logger → better-auth handler → body parsers → routers)
   ↓
routes/*.routes.ts  (requireAuth → requireWorkspaceRole(roles, resolveWorkspaceId) → validate(zodSchemas) → rate limiter)
   ↓
controllers/*.controller.ts  (parse req, call one service method, sendSuccess/next(err))
   ↓
services/*.service.ts  (business rules, db.$transaction for multi-step writes)
   ↓
repositories/*.repository.ts  (only files calling db.<model>.* directly)
   ↓
@repo/database (Prisma Client) → PostgreSQL
```

Authorization is per-workspace: `WorkspaceMember` is a join table carrying `WorkspaceRole` (ADMIN/EDITOR/VIEWER), and every protected route resolves "which workspace does this request concern" (directly, or by walking a project/artifact id up its ancestry) before checking the caller's membership row for that specific workspace (`apps/api/src/middleware/rbac.middleware.ts`). This is necessarily request-shaped-and-ancestry-aware because the product is multi-tenant: a `WRITE_ROLES` check has no meaning without first pinning down *which* workspace's role applies.

## Proposed Architecture

The domain model changes (Workspace/Project/Artifact/Version → Article/TechRead/Submission/Comment/Asset), but the layering does not. The proposed shape mirrors the existing one exactly:

```
apps/web
   ↓
apps/api/src/app.ts   (unchanged: same cors/logger/better-auth/body-parser pipeline)
   ↓
routes/article.routes.ts, routes/tech-read.routes.ts, routes/submission.routes.ts, routes/comment.routes.ts
   ↓ requireAuth → requireRole([...]) → validate(zodSchemas) → rate limiter (write routes only)
controllers/article.controller.ts, tech-read.controller.ts, submission.controller.ts, comment.controller.ts
   ↓
services/article.service.ts, tech-read.service.ts, submission.service.ts (owns the publish/reject transaction), comment.service.ts
   ↓
repositories/article.repository.ts, tech-read.repository.ts, submission.repository.ts, comment.repository.ts, asset.repository.ts
   ↓
@repo/database (Prisma Client, already regenerated against the new schema) → PostgreSQL
```

**RBAC middleware change, concretely.** `requireWorkspaceRole(allowedRoles, resolveWorkspaceIdFn)` — which needs a resolver because "role" is meaningless without first identifying a workspace — is replaced by a much simpler `requireRole(allowedRoles: Role[])`, since `Role` now lives directly on the authenticated `User` (`req.user.role`, no lookup required at all: no repository call, no resolver, no ancestry-walking). This is strictly less code and fewer round-trips than the OLD `rbac.middleware.ts`, precisely because the multi-tenancy this middleware existed to protect has been removed from the domain model. The 404-over-403 "hide existence from non-members" behavior in the OLD middleware (`resolveWorkspaceIdFrom*` + `NotFoundError` when no membership row exists) has no equivalent need in the new model — there is no per-resource membership to hide; a `NotFoundError` is only needed for a genuinely missing/soft-deleted `Article`/`TechRead`/`Submission` id, which the repository layer already needs to check regardless of role.

**Where ownership checks now live that used to be role checks.** In the OLD product, "can I edit this artifact" was purely role-based (any workspace EDITOR could edit any artifact in that workspace — see the flag in `000-project-analysis.md`). In the new product, `submission.service.ts` must add an explicit ownership check that did not exist before: a `CONTRIBUTOR` may only create/edit their *own* `Submission` (`submittedBy === req.user.id`), while an `ADMIN` may act on any submission. This is a genuinely new authorization dimension the pivot introduces (see `001`'s non-functional-requirements section on trust), not a reuse of the OLD pattern — it will live in the service layer as a plain equality check, the same place `workspaceMemberService.assertNotLastAdmin` already puts an application-level invariant that isn't expressible as route middleware (`apps/api/src/services/workspace-member.service.ts` lines 81-88).

**Transaction reuse.** The publish/reject flow (`001`, Functional Requirement 6) needs exactly the `db.$transaction(async (tx) => { ... })` pattern already used four times in the OLD codebase (`workspace.service.ts` create, `artifact.service.ts` create/update/delete, `version.service.ts` restore) — same Prisma Client, same transaction API, just applied to `Submission` + `Article`/`TechRead` instead of `Artifact` + `Version`. No new transactional infrastructure is required.

**Pagination reuse.** `apps/api/src/lib/pagination.ts` (`encodeCursor`/`decodeCursor`/`buildKeysetWhere`/`paginateResults`) is generic over any model shape with an `id` and a sortable field — it is already written in a way that a new `article.repository.ts`'s `findPublished({ category, cursor, limit, sortBy, sortOrder })` can call `buildKeysetWhere`/`paginateResults` exactly as `artifact.repository.ts`'s `findByProject` does today. No changes to this file are anticipated.

**Response/error envelope reuse.** `sendSuccess()` (`apps/api/src/lib/response.ts`) and the `AppError` hierarchy (`apps/api/src/lib/errors.ts`) plus `errorMiddleware` (`apps/api/src/middleware/error.middleware.ts`) are domain-agnostic already — they reference no OLD-product model names — and carry over unchanged.

**Validation package reuse.** `@repo/validation` (`packages/validation/src`) already establishes the pattern of one Zod schema file per resource (`workspace.schema.ts`, `project.schema.ts`, `artifact.schema.ts`, `workspace-member.schema.ts`, `common.schema.ts` for shared primitives like id/pagination params) exported from a single `index.ts`. The proposed change adds `article.schema.ts`, `tech-read.schema.ts`, `submission.schema.ts`, `comment.schema.ts` following the same file-per-resource convention, reusing `common.schema.ts`'s existing pagination/id-param primitives rather than redefining them.

## Requirement → Codebase Mapping

| Requirement | Existing Code | Required Change | Database | Backend | Frontend |
|---|---|---|---|---|---|
| Platform-wide roles replace per-workspace roles | `apps/api/src/middleware/rbac.middleware.ts` (`requireWorkspaceRole` + 3 resolvers); `apps/web/hooks/use-workspace-role.ts` | New `requireRole(Role[])` middleware reading `req.user.role` directly, no resolver/repository lookup needed | Already done in schema — `Role` enum on `User`, no `WorkspaceMember` table in new schema | New `middleware/rbac.middleware.ts` (rewritten, not extended — the resolver concept goes away entirely) | New `hooks/use-user-role.ts` reading role off the session user object directly (no cross-referencing a workspace list) |
| Admin-only publish/reject action | `rbac.middleware.ts`'s existing `ADMIN_ONLY` role-group pattern (`apps/api/src/routes/workspace.routes.ts` uses it for rename/delete) | Reuse the same "require this exact role array" pattern, just with `Role.ADMIN` instead of `WorkspaceRole.ADMIN`, on new submission-review routes | No schema change — `Role.ADMIN` and `Submission.status`/`reviewedBy`/`reviewedAt` already exist | New `routes/submission.routes.ts` (`PATCH /submissions/:id/publish`, `PATCH /submissions/:id/reject`), `controllers/submission.controller.ts`, `services/submission.service.ts` (owns the atomic transaction from `001` FR6) | New admin review-queue page + submission detail view with Publish/Reject actions |
| Atomic publish transaction (Submission + parent) | `db.$transaction` pattern in `apps/api/src/services/artifact.service.ts` (create) and `apps/api/src/services/version.service.ts` (restore) | Apply the identical `db.$transaction(async (tx) => {...})` shape to update `Submission` + `Article`/`TechRead` together | No schema change — this is purely an application-layer transaction requirement the schema's own comment already calls out (`schema.prisma` lines 308-313) | `submission.service.ts::publish()` / `::reject()` | Review-queue UI shows a single "Publish"/"Reject" action; no partial-success state to render since the transaction is all-or-nothing |
| Versioned resubmission after rejection | `versionService.recordVersion`'s next-version-number pattern (`apps/api/src/services/version.service.ts` lines 21-42) | Reuse "find max version for this parent, +1" logic against `Submission.version` scoped by `articleId`/`techReadId` instead of `Artifact.version` scoped by `artifactId` | No schema change — `@@unique([articleId, version])` / `@@unique([techReadId, version])` already enforce this | New `submissionRepository.findLatestVersionNumber(articleId \| techReadId)` mirroring `versionRepository.findLatestVersionNumber` | Contributor's "revise and resubmit" UI pre-fills a new draft from the rejected submission's content client-side |
| Contributor create/submit Article or TechRead | `artifactService.create` (create parent + related row in one transaction) — `apps/api/src/services/artifact.service.ts` lines 16-48 | Same shape: create `Article`/`TechRead` + its initial `Submission` together in one transaction | No schema change | New `article.controller.ts`/`.service.ts`/`.repository.ts` and `tech-read.*` equivalents | New "New Article" / "New Tech Read" forms, reusing existing dialog/form UI patterns from `apps/web/components/workspace/projects/create-project-dialog.tsx` as a template |
| Category/status-filtered article listing, paginated | `artifactRepository.findByProject` cursor-pagination pattern + `apps/api/src/lib/pagination.ts` (generic, reusable as-is) | New repository method following the identical `buildKeysetWhere`/`paginateResults` call shape | No schema change — `@@index([category, status])` on `Article` already provisioned for this | New `articleRepository.findPublished({ category, cursor, limit, sortBy, sortOrder })` | New category browse page using the same "load more" infinite-scroll pattern implied by the OLD product's `nextCursor`/`hasMore` meta shape |
| Admin review queue, oldest-pending-first | No direct OLD analog (no moderation queue existed) — closest precedent is `workspaceMemberRepository.list`'s plain `findMany` with `orderBy` | New repository method, no pagination-cursor complexity strictly required initially since queue depth is naturally bounded, but should follow the same cursor convention for consistency | No schema change — `@@index([status, submittedAt])` on `Submission` already provisioned for this | New `submissionRepository.findPendingReview()` | New admin-only review-queue page |
| Threaded comments on published content | No OLD analog exists in `apps/api/src` at all (the OLD `Comment` model has zero backend code — see `000`'s flag) | Net-new feature, but the *data model* (self-relation `parentCommentId`, `deletedAt` soft delete) is structurally identical to the OLD schema's unimplemented `Comment` model, just re-pointed at `articleId`/`techReadId` instead of `artifactId` | `Comment.articleId`/`techReadId` exactly-one-of enforced by raw CHECK constraint (`migration.sql` lines 84-85) since Prisma has no attribute for it | New `comment.routes.ts`/`.controller.ts`/`.service.ts`/`.repository.ts` — the first real implementation of this feature for either product | New comment thread component (net-new; no OLD frontend precedent to extend since the feature was never built) |
| Comment moderation (soft delete, no orphaned replies) | OLD schema's `Comment.parentCommentId` was `onDelete: Cascade` (never exercised, no backend code) | New schema switches this FK to `onDelete: Restrict` — already done in `migration.sql` lines 66-73 | Already migrated | `comment.service.ts::softDelete()` must reject a hard-delete attempt on a comment with live replies (the DB itself refuses it as defense-in-depth, matching the schema's stated intent at lines 528-531) | Comment UI shows a "[deleted]" placeholder for soft-deleted comments that still have visible replies, same UX pattern as most threaded-comment products |
| Image upload embedded in Markdown | `imageService.upload` + `uploadObject` (`apps/api/src/services/image.service.ts`, `apps/api/src/lib/object-storage.ts`) + `imageUpload` multer middleware (`apps/api/src/middleware/upload.middleware.ts`) — all three are already domain-agnostic (parameterized by an arbitrary `key` prefix, not hardcoded to "artifacts/") | Reuse all three files unchanged; only the `key` prefix passed in changes from `artifacts/${artifactId}/...` to `submissions/${submissionId}/...`, and the result now creates an `Asset` row instead of just returning a bare URL | No schema change — `Asset.submissionId` already modeled | `submission.service.ts` (or a small `asset.service.ts`) calls the existing `imageService.upload`/`uploadObject`, then persists an `Asset` row via a new `asset.repository.ts` | Markdown editor's "insert image" button, same interaction as an OLD Markdown artifact editor would have needed (never fully built on the frontend per `000`'s findings) |
| Markdown sanitization | `markdownService.sanitizeContent`/`sanitizeText` (`apps/api/src/services/markdown.service.ts`) — already generic over "a string of Markdown/HTML," not tied to `ArtifactType` beyond a type-name allowlist check | Reuse `sanitizeMarkdownText` directly on `Submission.content` (drop the `MARKDOWN_ARTIFACT_TYPES` type-gate entirely, since every `Submission` is Markdown — no `ArtifactType` equivalent exists in the new schema) | No schema change | `submission.service.ts` calls `markdownService.sanitizeText(content)` before persisting | No change (sanitization is a backend concern) |
| Auth (login/signup/OAuth/verification/reset) | `packages/auth/src`, `apps/api/src/lib/auth.ts`, `apps/web/app/(auth)/**` | **No change required** — better-auth's session/user model is orthogonal to the pivot; only the `Role` enum stored on `User` changes shape (was a bare `String`, now a `Role` enum), which `better-auth`'s Prisma adapter is agnostic to | `User.role` type change already done (`Role` enum, default `READER`) in the working-tree schema | None needed in `lib/auth.ts` itself | None needed in `apps/web/app/(auth)/**` |
| Rate limiting on writes | `mutationRateLimiter`/`uploadRateLimiter` (`apps/api/src/middleware/rate-limit.middleware.ts`) — already generic Express middleware, no OLD-domain coupling | Reuse unchanged on new submission/comment/asset-upload write routes | No schema change | Attach existing middleware instances to new routes | No change |

## Why This Approach

The pivot is a **domain-model change, not an architecture change**. Every cross-cutting concern the OLD product already solved — layered routing, cursor pagination, transactional multi-table writes, a uniform success/error envelope, Zod-schema-per-resource validation, Markdown sanitization, S3-compatible file upload, better-auth session handling — is implemented in files that reference no OLD-product model names (`pagination.ts`, `response.ts`, `errors.ts`, `error.middleware.ts`, `validate.middleware.ts`, `markdown.service.ts`, `object-storage.ts`, `image.service.ts`/`upload.middleware.ts`, `lib/auth.ts`). These are reused as-is. What *does* change is (1) the RBAC middleware, because the trust model genuinely changed from per-tenant to platform-wide, and (2) every resource-specific route/controller/service/repository file, because the resources themselves changed (Workspace/Project/Artifact/Version → Article/TechRead/Submission/Comment/Asset). This is exactly the "existing architecture + minimal necessary changes" standard the project's own engineering guidelines call for (`prompt.md` section 1) — rewriting the Express app, the transaction strategy, the pagination strategy, or the validation strategy would be unjustified churn with no requirement driving it.

## Alternatives Considered

**On removing multi-tenancy: this is already a decided, not an open, question.** The new `schema.prisma` has already deleted `Workspace`, `WorkspaceMember`, and `Project` outright — there is no `Workspace` model, no tenant-scoping foreign key anywhere in the new schema, and the schema's own header comment frames the product as a single, platform-wide knowledge base rather than a multi-tenant one. Documenting this as a decision already made, with the reasoning below, rather than as an open question this document needs to resolve:

```
Option A — Keep Workspace as a no-op single-tenant wrapper
Pros: Would let RBAC middleware code (resolveWorkspaceIdFrom*, requireWorkspaceRole) survive with minimal changes; theoretically preserves a future path back to multi-tenancy without another migration.
Cons: Every route would need to resolve a meaningless "the one workspace" id and every list query would need a needless join/filter for a distinction that no longer exists in the product's business model; adds a foreign key and a lookup to every single request for zero behavioral benefit; contradicts the product's own stated pivot (a platform-wide knowledge base has no notion of "which workspace is this article in").

Option B — Fully remove multi-tenancy (accepted; already implemented in schema.prisma)
Pros: Matches the actual product requirement (one shared platform, not per-tenant silos); collapses "is this user allowed" into a single `req.user.role` check with zero extra queries; removes an entire join table (`WorkspaceMember`) and an entire class of "which workspace does this resource belong to" resolver code that existed solely to support tenant isolation.
Cons: If the product ever needs multi-tenancy again (e.g. a future "private company knowledge base" tier), that would require reintroducing a scoping model from scratch rather than reactivating a dormant one.

Decision: Option B (already reflected in the current schema.prisma).
Reason: The product being built is explicitly a single shared engineering-knowledge platform (per the schema's own header comment), not a multi-tenant SaaS. Carrying dead multi-tenancy scaffolding forward (Option A) would add real per-request cost and code complexity to protect against a scenario the product does not have, violating the "smallest correct change" principle. If multi-tenancy is ever needed again, it is cheaper to add a scoping model to a schema that doesn't pretend to have one than to keep an unused one artificially alive.
```

**On the RBAC middleware itself — the design decision inherited from the OLD codebase, evaluated for reuse:**

```
Option A — Keep `requireWorkspaceRole`'s resolver-function shape, but resolve "the one Role a user has" via a trivial constant-true resolver
Pros: Superficially minimal diff to rbac.middleware.ts.
Cons: The resolver pattern exists specifically to answer "which workspace does this ancestry chain point to" — a question that no longer exists. Keeping the shape only to immediately no-op it is confusing to future maintainers and preserves dead abstraction for no benefit.

Option B — Replace with a plain `requireRole(allowedRoles: Role[])` reading `req.user.role` directly (accepted)
Pros: Simpler, matches what the data actually is (a flat field on the authenticated user, no lookup); removes the now-meaningless 404-vs-403 "hide workspace existence" logic, since there's no per-resource membership left to hide.
Cons: None identified — this is a strict simplification enabled by the schema change already having happened.

Decision: Option B.
Reason: The resolver abstraction's entire reason to exist (per-request, ancestry-dependent workspace resolution) is gone once `Role` lives directly on `User`. Preserving it would be complexity without a corresponding requirement.
```
