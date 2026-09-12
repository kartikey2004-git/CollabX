# 001 — Requirements Analysis (Pivot: CollabX → Engineering Knowledge Platform)

**Status of this document**: this is a requirements specification for work that has **not been implemented yet**. `packages/database/prisma/schema.prisma` (uncommitted, current working tree) already encodes the target data model; `apps/api` and `apps/web` still contain only the OLD product's code (see `000-project-analysis.md`). Nothing in this document should be read as "already built" — every requirement below is forward-looking, derived from the new schema's models, enums, and its own extensive doc comments (`packages/database/prisma/schema.prisma`), plus the uncommitted migration `packages/database/prisma/migrations/20260910120000_submission_ownership_and_check_constraints/migration.sql` which shows how the schema arrived at its current shape.

## Functional Requirements

Derived directly from the models already defined in `packages/database/prisma/schema.prisma`:

1. **Browse published content by category.** Readers must be able to list `Article` rows filtered by `Category` (`BACKEND_ENGINEERING`, `FRONTEND_ENGINEERING`, `ENGINEER_ARTICLES`, `SYSTEM_DESIGN`, `DISTRIBUTED_SYSTEMS`, `INFRASTRUCTURE`, `DEVOPS`) and by `status = PUBLISHED`, paginated (the schema's `@@index([category, status])` on `Article` exists specifically for this).
2. **Browse a "Trending Tech Reads" feed.** Readers must be able to list `TechRead` rows ordered/filtered by `isTrending` and `trendingScore` (`@@index([isTrending, trendingScore])` on `TechRead`), each pointing at an external URL with a curator's annotation (`TechRead.description`, `sourceName`, `tags`).
3. **Contributors create and submit Articles.** A `CONTRIBUTOR` (or `ADMIN`) can create a new `Article` (title, category, slug) and author its Markdown body as a `Submission` (`content`, `title`, `summary`), moving the submission from `DRAFT` to `PENDING_REVIEW` when ready for review. The `Article` row itself is never directly editable by a contributor — only new `Submission` rows against it are (per the schema's own comment on `Article.createdBy`, lines 216-217 of `schema.prisma`).
4. **Contributors create and submit Tech Reads.** Same submission-based workflow as Articles, but for `TechRead` (curating an `externalUrl`, required per the schema and the migration's step 8 which makes it `NOT NULL`, plus optional `sourceName`/`category`/`tags`).
5. **Admin review queue.** An `ADMIN` must be able to list all `Submission` rows with `status = PENDING_REVIEW`, oldest first (the schema's `@@index([status, submittedAt])` on `Submission` exists specifically for this "moderation queue" query), and view the full proposed content (title/summary/content) alongside the current published version (if any) for comparison.
6. **Admin publish/reject a submission.** Publishing must, in one atomic operation: set `Submission.status = PUBLISHED` (+ `reviewedBy`, `reviewedAt`), and on the parent `Article`/`TechRead`: `status = PUBLISHED`, `currentSubmissionId = <this submission>`, `publishedAt = now()`, and (since title/summary/description are denormalized onto the parent for fast listing) copy the submission's `title`/`summary` onto the parent. Rejecting must set `Submission.status = REJECTED`, `reviewedBy`, `reviewedAt`, and `rejectionReason`, and must **not** touch the parent's `status`/`currentSubmissionId` at all if the parent already has a different published version — this is explicitly required by the schema's own comment on `Submission` (lines 308-313 of `schema.prisma`): "Doing this outside a transaction is how you end up with a 'published' article whose currentSubmissionId still points at the old version."
7. **Versioned resubmission after rejection.** A rejected `Submission` is never edited in place. The contributor's next attempt must create a brand-new `Submission` row with the next `version` number for the same `articleId`/`techReadId` (enforced uniquely by `@@unique([articleId, version])` / `@@unique([techReadId, version])`), leaving the rejected row and its `rejectionReason` permanently in the history.
8. **Threaded comments on published content.** Any authenticated user (any `Role`) can comment on a `PUBLISHED` `Article` or `TechRead`, and reply to another comment (`Comment.parentCommentId` self-relation). Exactly one of `Comment.articleId`/`Comment.techReadId` must be set — enforced at the DB level by the `comments_article_xor_tech_read` CHECK constraint added in `migration.sql` lines 84-85, since Prisma's schema language has no attribute for "exactly one of these two columns."
9. **Comment moderation / removal.** A comment's author (or an `ADMIN`) can soft-delete it (`Comment.deletedAt`); a parent comment with live replies cannot be hard-deleted — the DB physically refuses it (`parentComment` FK is `onDelete: Restrict`, changed from the OLD schema's `Cascade` specifically so replies are never destroyed as a side effect — see `migration.sql` lines 66-73 and the schema's own rationale at lines 528-531).
10. **Image uploads embedded in Markdown.** A contributor authoring a `Submission` can upload an image that becomes an `Asset` row scoped to that specific `Submission` (not to the `Article`/`TechRead` as a whole — see schema comment lines 416-420), returning a URL to embed via standard Markdown image syntax in `Submission.content`.
11. **Platform-wide RBAC.** Every user has exactly one `Role` (`ADMIN | CONTRIBUTOR | READER`, default `READER`) on the `User` row itself — no more per-resource membership table. `ADMIN` has full CRUD + moderation + publish rights; `CONTRIBUTOR` can create Articles/TechReads and Submissions but cannot update or publish them directly; `READER` is the default (can browse and comment only). This replaces the OLD product's `WorkspaceMember`-scoped `WorkspaceRole`.
12. **Diagrams via Markdown, not a separate artifact type.** Unlike the OLD product's dedicated `ArtifactType.EXCALIDRAW`, the new schema deliberately has no diagram-specific field — Mermaid fences (```` ```mermaid ````) inside `Submission.content` render as diagrams directly (schema comment, lines 293-295). This is a scope reduction, not a gap: there is no requirement to port Excalidraw support.
13. **Future AI search (not required to build now, but the data model must support it without further migration).** `VectorEmbedding` rows are owned one-to-one by a `Submission` (chunked Markdown + 768-dim pgvector embedding), scoped per reviewed version so a rejected/older draft's embeddings never collide with the currently-published version's.

## Non-Functional Requirements

- **Performance.** Category- and status-filtered article listing (`Article` list by `category` + `status = PUBLISHED`) and the admin review queue (`Submission` list by `status = PENDING_REVIEW` ordered by `submittedAt`) must use the indexes the schema already provisions (`@@index([category, status])`, `@@index([status, submittedAt])`) and must be cursor-paginated, following the exact keyset pattern already implemented once in `apps/api/src/lib/pagination.ts` for the OLD product's workspace/project/artifact lists — that helper is generic enough to be reused as-is, not reinvented.
- **Security.** Publish/reject/moderate actions must be restricted to `ADMIN` only, enforced server-side (never trusted from the client) — mirroring the OLD product's existing pattern of route-level role middleware (`apps/api/src/middleware/rbac.middleware.ts`), just re-keyed off the new platform-wide `Role` instead of a per-workspace `WorkspaceMember` lookup. Ownership checks are required on `Submission` (only the original `submittedBy` contributor, or an `ADMIN`, may create a follow-up version or edit a `DRAFT`) and on `Comment` (only the author, or an `ADMIN`, may delete). **This is a net reduction in isolation complexity, not an increase**: the OLD product had to resolve a workspace id from arbitrarily deep resource ancestry (artifact → project → workspace) on every request specifically to enforce multi-tenant data isolation between unrelated organizations; the new product has no tenant boundary at all; every `ADMIN` sees and moderates everything. The trade is an **increase in platform-wide-trust requirements**: a single compromised or malicious `ADMIN` account now has blast radius over all content platform-wide, not just one workspace, so admin account security (strong auth, audit logging of publish/reject actions via `Submission.reviewedBy`/`reviewedAt`, no silent self-elevation of `Role` through a mass-assignable request body) matters proportionally more than it did in the OLD per-tenant model.
- **Reliability.** The publish transaction described in Functional Requirement 6 must be atomic — a single `prisma.$transaction` updating `Submission.status` and the parent `Article`/`TechRead`'s `status`/`currentSubmissionId`/`publishedAt` together, exactly as the schema's own doc comment on `Submission` (lines 308-313) warns is required, to prevent a published article whose `currentSubmissionId` disagrees with its `status`. This directly parallels the OLD product's existing transactional patterns (`workspaceService.create`, `artifactService.create/update/delete`, `versionService.restore` in `apps/api/src/services/*.service.ts`, all of which already wrap multi-table writes in `db.$transaction`), so no new transactional pattern needs to be invented — only applied to the new domain.
- **Scalability.** No further schema change should be required to add AI-powered search later: `VectorEmbedding` and `Asset` already hang off `Submission` with the idempotency-safe unique constraints (`@@unique([submissionId, chunkIndex])`, `@@unique([submissionId, embeddingModel, contentHash])`) needed for safe re-indexing, per the schema's own note that `embeddingModel`/`contentHash` were deliberately made required (not nullable) so those constraints function as a real idempotency key (`schema.prisma` lines 457, 459).
- **Accessibility.** Any new frontend (review queue, article reader, comment thread, submission editor) must follow the same baseline the OLD frontend already establishes — semantic HTML, focus-manageable dialogs (OLD product's `create-workspace-dialog.tsx`/`delete-workspace-dialog.tsx` etc. as the existing pattern to extend), and toast-based (not color-only) success/error feedback (`sonner`, already a dependency in `apps/web/package.json`). No accessibility tooling beyond what's already present was found, so this is a requirement to *maintain* the existing bar, not to introduce new tooling.
- **Maintainability.** The pivot must be implemented by extending the existing layered architecture (routes → controllers → services → repositories → Prisma) already proven out for the OLD product, not by introducing a second parallel style. RBAC re-keys off `Role` instead of `WorkspaceRole`, but the middleware *shape* (a factory returning role-checking Express middleware) can be carried over largely unchanged — see `002-architecture-impact.md` for the concrete mapping.

## User Flows

### (a) Contributor creates and submits an Article

```
Contributor
 ↓
Opens "New Article" (selects Category)
 ↓
Writes title + Markdown content (draft autosaved as Submission, status=DRAFT)
 ↓
Clicks "Submit for review"
 ↓
Frontend validation (title/content non-empty, category is a valid enum value)
 ↓
API request: create Article (if new) + Submission, then transition Submission → PENDING_REVIEW
 ↓
Authentication (requireAuth — must be logged in)
 ↓
Authorization (Role must be CONTRIBUTOR or ADMIN)
 ↓
Business validation (submittedBy must equal the caller; version number is server-assigned, never client-supplied)
 ↓
Database operation (Article + initial Submission created together in one transaction, mirroring artifactService.create's pattern)
 ↓
Response (Submission with status=PENDING_REVIEW)
 ↓
UI update (Article now appears in the admin's review queue; contributor sees "pending review" state on their own submission)
```

### (b) Admin reviews and publishes/rejects a submission

```
Admin
 ↓
Opens review queue (Submissions where status=PENDING_REVIEW, oldest first)
 ↓
Opens one submission, reads proposed content vs. currently published version (if any)
 ↓
Decides: Publish or Reject
 ↓
Frontend validation (rejection requires a non-empty rejectionReason)
 ↓
API request: PATCH submission decision
 ↓
Authentication (requireAuth)
 ↓
Authorization (Role must be ADMIN — enforced server-side regardless of frontend state)
 ↓
Business validation (submission must currently be PENDING_REVIEW; publishing/rejecting a DRAFT, PUBLISHED, or already-REJECTED submission is an invalid transition and must be rejected by the application layer, since the ContentStatus enum itself does not restrict transitions)
 ↓
Database operation — Publish path: single prisma.$transaction updates Submission (status=PUBLISHED, reviewedBy, reviewedAt) AND the parent Article/TechRead (status=PUBLISHED, currentSubmissionId, publishedAt, denormalized title/summary). Reject path: updates only Submission (status=REJECTED, reviewedBy, reviewedAt, rejectionReason) — the parent's status/currentSubmissionId are left untouched.
 ↓
Response (updated Submission, and updated Article/TechRead on the publish path)
 ↓
UI update (item removed from the review queue; if published, it now appears in public category/trending listings)
```

### (c) Contributor whose submission was rejected creates a new version

```
Contributor
 ↓
Opens their rejected Submission (sees rejectionReason, content is read-only/frozen)
 ↓
Clicks "Revise and resubmit"
 ↓
Frontend pre-fills a new draft from the rejected submission's content as a starting point
 ↓
Contributor edits content
 ↓
Submits for review again
 ↓
Frontend validation (same as flow (a))
 ↓
API request: create a NEW Submission row (never a PATCH to the rejected row)
 ↓
Authentication (requireAuth)
 ↓
Authorization (caller must be the original submittedBy contributor, or an ADMIN)
 ↓
Business validation (version = previous max version for this articleId/techReadId + 1, server-computed — parallels the OLD product's versionService.recordVersion next-version-number logic; the old rejected row is never mutated)
 ↓
Database operation (new Submission row inserted, status=PENDING_REVIEW or DRAFT depending on whether "submit" was clicked immediately)
 ↓
Response (new Submission, version N+1)
 ↓
UI update (new pending submission appears in the admin queue; the old REJECTED submission remains visible in the Article's version/submission history for audit)
```

### (d) Reader browses and comments

```
Reader (any authenticated Role, including default READER)
 ↓
Opens a category page or the Trending Tech Reads feed
 ↓
Browses list (paginated, PUBLISHED-only, filtered by category/isTrending)
 ↓
Opens one Article/TechRead
 ↓
Reads content, scrolls to comment thread
 ↓
Writes a comment (optionally a reply to an existing comment)
 ↓
Frontend validation (non-empty body)
 ↓
API request: create Comment
 ↓
Authentication (requireAuth — commenting requires login even though browsing may not)
 ↓
Authorization (any Role may comment on PUBLISHED content; commenting on non-published content should be rejected by business validation, since only the article's own contributor/admin should see unpublished drafts at all)
 ↓
Business validation (exactly one of articleId/techReadId set — mirrors the DB's own CHECK constraint as a defense-in-depth application-layer check; parentCommentId, if present, must belong to the same article/techRead)
 ↓
Database operation (Comment row inserted)
 ↓
Response (created Comment, with author info attached)
 ↓
UI update (comment appears in the thread immediately, optimistically or via refetch — mirrors the OLD product's existing React Query optimistic-update pattern in apps/web/hooks/use-workspaces.ts's useDeleteWorkspace)
```

### (e) Curating a Tech Read

```
Contributor (or Admin)
 ↓
Opens "Add Tech Read"
 ↓
Enters externalUrl (required), sourceName, optional category, tags, and a short description/annotation
 ↓
Frontend validation (externalUrl must be a well-formed URL; required per schema — TechRead.externalUrl is NOT NULL as of migration.sql step 8)
 ↓
API request: create TechRead + initial Submission (title/description/content wrapping the curator's annotation), status=DRAFT or straight to PENDING_REVIEW
 ↓
Authentication (requireAuth)
 ↓
Authorization (Role must be CONTRIBUTOR or ADMIN)
 ↓
Business validation (same submission-versioning rules as Articles — TechRead shares the exact same Submission-based moderation pipeline per the schema's own comment, lines 244-245)
 ↓
Database operation (TechRead + Submission created together in one transaction)
 ↓
Response (TechRead with its pending Submission)
 ↓
UI update (appears in the admin review queue alongside Article submissions — same queue, since Submission is shared across both content types)
```
