# 000 — Project Analysis (Existing Application, Pre-Pivot)

**Scope of this document.** This describes the application exactly as it exists in the current git history and working tree for `apps/api` and `apps/web` — i.e. the "CollabX" / "Groundwork" multi-tenant collaborative knowledge base. Nothing in `apps/api` or `apps/web` has been touched for the pivot yet; only `packages/database/prisma/schema.prisma` has uncommitted changes (plus a new, uncommitted migration folder). Everything below reflects what is actually implemented and running today, not the pivot target.

- HEAD commit at time of analysis: `e874127 feat(api): add workspace members, artifact versioning, and image uploads`
- Last 5 commits: `e874127`, `228fc01`, `aac31f6`, `ffaf513`, `1e59df5` (`git log --oneline -5`)
- Working tree state: `package-lock.json` and `packages/database/prisma/schema.prisma` modified but uncommitted; a new untracked migration folder `packages/database/prisma/migrations/20260910120000_submission_ownership_and_check_constraints/`; untracked `prompt.md`. Since `apps/api` and `apps/web` are unmodified in the working tree, everything cited below (routes/controllers/services/repositories/middleware) is read directly from the working tree and is identical to HEAD for those directories.
- Old schema retrieved via `git show HEAD:packages/database/prisma/schema.prisma` (the current working-tree `schema.prisma` is the NEW, pivoted schema and is analyzed separately in `001`/`002`).

## Project Overview

The application (product name "CollabX", frontend-branded "Groundwork") is a multi-tenant, AI-enhanced collaborative knowledge base — comparable to "Notion meets Obsidian, with built-in RAG/AI capabilities" per the schema's own header comment (`git show HEAD:packages/database/prisma/schema.prisma`, line 1).

The implemented hierarchy is:

```
Workspace (multi-tenant boundary)
  → Project (a folder/documentation space)
    → Artifact (a document/diagram/note: MARKDOWN | EXCALIDRAW | DB_SCHEMA | AI_NOTE)
      → Version (immutable snapshot history)
      → Comment (threaded, optionally anchored to a text selection)
```

As currently built, `apps/api` fully implements: user auth (via `better-auth`), workspace CRUD + membership/role management, project CRUD, artifact CRUD with a tree structure (parent/child pages) and drag-and-drop-style sibling ordering, artifact version history + restore, and inline image upload for Markdown artifacts (`apps/api/src/routes/*.routes.ts`, `apps/api/src/controllers/*.controller.ts`, `apps/api/src/services/*.service.ts`, `apps/api/src/repositories/*.repository.ts`).

What the schema clearly intends but that has **no corresponding backend route/controller/service in `apps/api/src`**: `Comment` (model exists in the old schema with self-relation threading, but there is no `comment.controller.ts`/`comment.routes.ts`/`comment.service.ts`/`comment.repository.ts` anywhere in `apps/api/src`) and `VectorEmbedding`/RAG search (model exists, no indexing worker, no search endpoint, no AI/embedding client code found anywhere in `apps/api/src`). These are schema-only, unimplemented features in the OLD product as it stands at HEAD.

`apps/web` implements: marketing/landing page (`apps/web/components/groundwork-landing/*`), auth pages (login/signup/forgot-password/reset-password/verify-email under `apps/web/app/(auth)/`), and a workspace app shell (`apps/web/app/workspace/**`) with sidebar navigation, workspace/project/artifact list views, and create/delete dialogs for workspaces, projects, and artifacts (`apps/web/components/workspace/**`). There is no Excalidraw canvas component, no rich Markdown/TipTap editor component, and no comment UI found under `apps/web/components` — the frontend for artifact *content editing* itself (as opposed to artifact list/create/delete chrome) was not found in the files read.

## Technology Stack

Versions below are taken directly from each package's `package.json` — not guessed.

**Frontend** (`apps/web/package.json`):
- Next.js `^14.1.1` (App Router — confirmed by the `app/` directory structure with route groups like `(auth)` and dynynamic segments like `[workspaceId]`)
- React `^18.2.0` / React DOM `^18.2.0`
- TanStack React Query `^5.62.0` for server-state (`apps/web/hooks/use-*.ts`, `apps/web/lib/query-client.tsx`)
- Tailwind CSS `^4.1.13` (`@tailwindcss/postcss`)
- `better-auth` `^1.6.22` client (`packages/auth/src/client.ts`, re-exported via `packages/auth/src/index.ts`)
- `zod` `^4.4.3` for client-side form validation (`apps/web/validation/auth-validation.ts`)
- `sonner` for toasts, `lucide-react` for icons, `framer-motion` for landing-page animation

**Backend** (`apps/api/package.json`):
- Express `^5.1.0` (note: Express 5's router uses path-to-regexp v7+, which required the `/api/auth/*splat` named-wildcard syntax instead of Express 4's bare `*` — see `apps/api/src/app.ts` line 54)
- `better-auth` `^1.6.22` server (`apps/api/src/lib/auth.ts`)
- `zod` `^4.4.3` — request validation, shared via `@repo/validation` workspace package
- `multer` `^2.2.0` (in-memory storage) for multipart image upload (`apps/api/src/middleware/upload.middleware.ts`)
- `@aws-sdk/client-s3` `^3.1091.0` — S3-compatible object storage client (MinIO locally per `apps/api/src/lib/object-storage.ts` comments)
- `sanitize-html` `^2.17.6` — Markdown/HTML sanitization (`apps/api/src/services/markdown.service.ts`)
- `resend` `^6.17.2` — transactional email (`apps/api/src/lib/email.ts`)
- `express-rate-limit` `^7.5.0` — rate limiting (`apps/api/src/middleware/rate-limit.middleware.ts`)
- `pino` / `pino-http` — structured logging
- `cors` `^2.8.6`

**Database** (`packages/database/package.json`):
- PostgreSQL (`datasource db { provider = "postgresql" }`)
- Prisma `^7.8.0` (`@prisma/client`, `prisma` devDependency), using the newer `prisma-client` generator (not `prisma-client-js`) with a custom output path `../src/generated/prisma`
- `@prisma/adapter-pg` `^7.8.0` and `pg` `^8.22.0` — driver adapter, meaning Prisma 7's new driver-adapter model is in use rather than Prisma's built-in query engine binary
- `pgvector` extension is used at the raw-SQL level for the `VectorEmbedding.embedding Unsupported("vector(768)")` column; an HNSW index is added by hand via a dedicated migration (`packages/database/prisma/migrations/20260726160000_add_hnsw_vector_index`, referenced in the schema's own comments)

**Infrastructure / external services actually referenced in code:**
- Object storage: S3-compatible (MinIO in dev per `apps/api/src/config/index.ts` defaults — `s3Endpoint: http://localhost:9000`, bucket `artifact-uploads`); no code path found targeting a specific cloud provider, it's configured to be swappable.
- Email: Resend (`apps/api/src/lib/email.ts`)
- No CI/CD config, Dockerfile, or deployment manifest was found in the directories read; this document does not claim one exists.
- Monorepo tooling: Turborepo (`turbo.json` implied by `package.json` scripts using `turbo run ...`), npm workspaces (`apps/*`, `packages/*`).

## Architecture

The backend follows a strict layered architecture, confirmed by reading the actual files (not inferred):

```
Frontend (apps/web)
   ↓  fetch() via apps/web/lib/api-client.ts (adds credentials: "include", unwraps {success,data,meta} envelope)
Express App (apps/api/src/app.ts)
   ↓  cors → pino-http logger → better-auth handler mount (/api/auth/*splat) → express.json/urlencoded → routers
Routes (apps/api/src/routes/*.routes.ts)
   ↓  requireAuth → requireWorkspaceRole(...) → validate({params,query,body}) → rate limiters on writes
Controllers (apps/api/src/controllers/*.controller.ts)
   ↓  parse req.params/req.body/req.query, call one service method, sendSuccess()/next(err)
Services (apps/api/src/services/*.service.ts)
   ↓  business rules, cross-repository orchestration, db.$transaction() for multi-step writes
Repositories (apps/api/src/repositories/*.repository.ts)
   ↓  the only files that call `db.<model>.*` directly
Prisma Client (@repo/database, packages/database/src)
   ↓
PostgreSQL
```

This is confirmed end-to-end for every resource, e.g. `workspace.routes.ts` → `workspace.controller.ts` → `workspace.service.ts` → `workspace.repository.ts` + `workspace-member.repository.ts` (workspace creation is transactional: `workspaceService.create` wraps `workspaceRepository.create` + `workspaceMemberRepository.create` in a single `db.$transaction`, `apps/api/src/services/workspace.service.ts` lines 13-25, so a workspace is never created without its creator becoming an ADMIN member).

Route files consistently split "nested" routers (mounted under a parent resource, e.g. `/workspaces/:workspaceId/projects`) from "direct" routers (mounted by resource id, e.g. `/projects/:id`), then combine both in `apps/api/src/routes/v1.routes.ts`. Example: `project.routes.ts` exports both `nestedProjectRouter` and `directProjectRouter`; same pattern in `artifact.routes.ts`.

Cross-cutting middleware, in the order actually applied:
1. `cors` (credentials: true, origin from `NEXT_PUBLIC_APP_URL`)
2. `pinoHttp` request logging
3. better-auth's own Express handler, mounted **before** the JSON body parsers because it needs the raw request body (`apps/api/src/app.ts` lines 52-57)
4. `express.json()` / `express.urlencoded()`
5. Per-route: `requireAuth` (`apps/api/src/middleware/auth.middleware.ts`) → `requireWorkspaceRole(...)` (`apps/api/src/middleware/rbac.middleware.ts`) → `validate({...})` (Zod, `apps/api/src/middleware/validate.middleware.ts`) → optional `mutationRateLimiter`/`uploadRateLimiter` (`apps/api/src/middleware/rate-limit.middleware.ts`) → optional `imageUpload` (multer, `apps/api/src/middleware/upload.middleware.ts`)
6. `errorMiddleware` registered last, only catches errors passed via `next(err)` (`apps/api/src/middleware/error.middleware.ts`) — it maps `AppError` subclasses to their status codes, translates specific Prisma error codes (P2002 duplicate → 409, P2025 missing record → 404, P2003 FK violation → 409), maps multer's file-size error to 413, and otherwise logs and returns a generic 500.

All successful responses share one envelope shape via `sendSuccess()` (`apps/api/src/lib/response.ts`): `{ success: true, data, meta? }`. All error responses share `{ success: false, error: { code, message, details? } }` (`apps/api/src/lib/errors.ts` + `error.middleware.ts`). List endpoints use cursor/keyset pagination, not offset pagination — implemented once in `apps/api/src/lib/pagination.ts` and reused by every `findBy*` repository method (`workspace.repository.ts`, `project.repository.ts`, `artifact.repository.ts`).

On the frontend, `apps/web/app/workspace/**` (App Router, dynamic segments `[workspaceId]`, `[projectId]`, `[artifactId]`) renders the workspace shell; data fetching goes through React Query hooks in `apps/web/hooks/*.ts`, which all call the single `apiClient` wrapper in `apps/web/lib/api-client.ts`. `apps/web/middleware.ts` does an optimistic, cookie-existence-only redirect (no signature/DB check) between `/login`,`/signup` and `/workspace/*`, explicitly documented in its own comment as needing the actual pages to still validate the session server-side.

## Authentication

Implemented via `better-auth`, configured once in `apps/api/src/lib/auth.ts` and consumed on the client via `packages/auth/src/client.ts` (re-exported as `@repo/auth`).

- **Email/password**: enabled, `minPasswordLength: 8`, `requireEmailVerification: true`. Password reset (`sendResetPassword`) intentionally does **not** `await` the email send, specifically to make response timing identical whether or not the email exists (anti user-enumeration / timing-attack comment at `apps/api/src/lib/auth.ts` lines 46-53). Reset tokens expire in 1 hour (`resetPasswordTokenExpiresIn: 60*60`), and `revokeSessionsOnPasswordReset: true` kills all other sessions on a successful reset.
- **Email verification**: `sendOnSignUp: true`, `autoSignInAfterVerification: true`. Verification email sent via Resend (`apps/api/src/lib/email.ts` → `sendVerificationEmail`).
- **OAuth**: Google and GitHub are conditionally registered — `socialProviders.google`/`.github` are only added if both client id and secret are non-empty (`isGoogleConfigured`/`isGithubConfigured` in `apps/api/src/config/index.ts`), specifically to avoid registering a login button that would error when clicked. Account linking is enabled and trusts Google/GitHub as email-verified providers (`accountLinking.trustedProviders`).
- **Sessions**: cookie-based, 7-day expiry, `updateAge` of 1 day (rolling refresh) — `apps/api/src/lib/auth.ts` lines 73-76. `useSecureCookies` is tied to `isProduction`.
- **Session propagation to Express**: `requireAuth` middleware (`apps/api/src/middleware/auth.middleware.ts`) calls `auth.api.getSession({ headers: fromNodeHeaders(req.headers) })` on every protected request and attaches `req.user`/`req.session`; throws `UnauthenticatedError` (401) if no session is found. There is no separate JWT — better-auth's own cookie/session mechanism is the only credential.
- **Rate limiting**: better-auth's own built-in `rateLimit: { enabled: true }` is turned on for auth endpoints, separate from the app's own `express-rate-limit` middleware used for mutation/upload routes.
- **Frontend integration**: `apps/web/app/(auth)/*` pages plus `apps/web/validation/auth-validation.ts` (Zod schemas for login/signup/reset forms — note this validation is deliberately looser than the backend's, e.g. login doesn't re-check password length, "the server is the source of truth"). `apps/web/middleware.ts` does a cheap cookie-presence check (`getSessionCookie`) to redirect logged-in users away from `/login`/`/signup` and logged-out users away from `/workspace`, explicitly not a substitute for real server-side session validation.

## Authorization

Two layers, both enforced server-side (no reliance on frontend checks for any actual mutation):

1. **Route-level role gate — `apps/api/src/middleware/rbac.middleware.ts`.** `WorkspaceRole` is `ADMIN | EDITOR | VIEWER` (old schema, per-workspace). Role groups are predefined: `ALL_ROLES`, `WRITE_ROLES = [ADMIN, EDITOR]`, `ADMIN_ONLY = [ADMIN]`. `requireWorkspaceRole(allowedRoles, resolveWorkspaceId)` is a middleware **factory**: it takes a resolver function that figures out which workspace a request concerns (three resolvers exist: directly from a `:workspaceId`/`:id` param, by walking a project id up to its workspace, or by walking an artifact id up through its project to its workspace — `resolveWorkspaceIdFromParam`, `resolveWorkspaceIdFromProjectParam`, `resolveWorkspaceIdFromArtifactParam`), looks up the caller's `WorkspaceMember` row for that workspace, and rejects if either no membership exists or the membership's role isn't in the allowed set.
2. **Deliberate 404-over-403 information hiding**: if the user isn't a member of the workspace at all, the middleware throws `NotFoundError` (404), not `ForbiddenError` (403) — explicitly commented as preventing a non-member from being able to distinguish "doesn't exist" from "exists but you can't see it" (`rbac.middleware.ts` lines 44-49, 60-72). Only once membership is confirmed does a role mismatch produce a real `ForbiddenError` (403).
3. **Route wiring, verified per resource:**
   - Workspaces: create/list require only `requireAuth` (any logged-in user can create a workspace, becoming its ADMIN); rename/delete require `ADMIN_ONLY` (`workspace.routes.ts`).
   - Workspace members: invite/updateRole/remove all `ADMIN_ONLY`; list is `ALL_ROLES` (`workspace-member.routes.ts`).
   - Projects: create requires `WRITE_ROLES` (ADMIN or EDITOR); list is `ALL_ROLES`; update/delete resolve the workspace from the project id and require `WRITE_ROLES` (`project.routes.ts`).
   - Artifacts: same pattern — create/update/delete require `WRITE_ROLES` (resolved via project or artifact ancestry), get/list/parent/children/versions are `ALL_ROLES`, version restore and image upload require `WRITE_ROLES` (`artifact.routes.ts`).
4. **Service-level business rule beyond RBAC**: a workspace can never be left with zero ADMINs — `workspaceMemberService.updateRole`/`.remove` call `assertNotLastAdmin`, which throws a `ValidationError` if demoting/removing the target would leave `countAdmins(workspaceId) <= 1` before the change is applied (`apps/api/src/services/workspace-member.service.ts` lines 39-59, 81-88). This is an application-layer invariant, not a DB constraint.
5. **Ownership vs. role**: authorization here is entirely role-based (per-workspace), not ownership-based — e.g. any EDITOR can edit any other EDITOR's artifact in the same workspace; there is no "only the creator can edit" check anywhere in `artifact.service.ts` or `project.service.ts`. `createdBy`/`updatedBy` fields are audit trail only, not access-control gates.
6. **Frontend authorization handling**: `apps/web/hooks/use-workspace-role.ts` exposes `useWorkspaceRole(workspaceId)` (looks up the cached role from `useWorkspaces()`) plus two pure helper predicates, `canManageWorkspace` (ADMIN only) and `canManageProjectsAndArtifacts` (ADMIN or EDITOR) — used to conditionally render UI (e.g. hide delete buttons), but this is UX-only; the same rules are independently re-enforced server-side per point 3 above.
7. **Platform-level fields that exist but have no visible enforcement path**: `User.role` (a bare `String`, default `"USER"`, in the OLD schema — not an enum, unlike the new schema's `Role` enum) plus `banned`/`banReason`/`banExpires`. No code in `apps/api/src` was found that reads or enforces `User.role`, `banned`, or `banExpires` — they appear to be schema-level scaffolding for a platform-admin/moderation feature that isn't wired into any middleware or route yet.

## Database (OLD schema, via `git show HEAD:packages/database/prisma/schema.prisma`)

**Enums:** `WorkspaceRole` (ADMIN/EDITOR/VIEWER), `ArtifactType` (MARKDOWN/EXCALIDRAW/DB_SCHEMA/AI_NOTE), `IndexStatus` (NOT_INDEXED/INDEXING/INDEXED/STALE).

**Models and key relations:**
- `User` — id (cuid), unique `email`, `passwordHash` (nullable, OAuth-only accounts have none), `emailVerified`, plain-string `role` (default `"USER"`, not an enum — see flag below), `banned`/`banReason`/`banExpires`. Relations: `accounts`/`sessions` (better-auth), `ownedWorkspaces` (1:N as `Workspace.ownerId`), `workspaceMembers` (join table), `createdArtifacts`/`updatedArtifacts` (two separate named relations to `Artifact`), `createdVersions`, `comments`, `createdProjects`/`updatedProjects`.
- `Session`/`Account`/`Verification` — standard better-auth-shaped tables. `Verification.type` is a bare `String` defaulting to `"email_verification"` (free text, not an enum, unlike the new schema's `VerificationType`).
- `Workspace` — the multi-tenancy boundary. `ownerId` FK `onDelete: Cascade` (deleting the owning user deletes the whole workspace — see flag below). Indexed on `name`, `ownerId`, `createdAt`.
- `WorkspaceMember` — pure join table between `User` and `Workspace`, composite primary key `@@id([workspaceId, userId])` (so a user can only have one membership row per workspace), carries the actual `role: WorkspaceRole` and `invitedAt`. Both FKs `onDelete: Cascade`.
- `Project` — belongs to one `Workspace` (`onDelete: Cascade`), has `createdBy` (`onDelete: Restrict` — can't delete a user while their project exists) and nullable `updatedBy` (`onDelete: SetNull`). Has its own `deletedAt` (soft delete) and a `slug` unique per workspace (`@@unique([workspaceId, slug])`). Composite index `@@index([workspaceId, deletedAt])` explicitly called out in the schema's own comment as a "partial index candidate" (full composite index chosen over a Postgres partial index, trading some index size for simplicity).
- `Artifact` — belongs to one `Project` (`onDelete: Cascade`), self-referential tree via nullable `parentArtifactId` (`onDelete: SetNull` — deleting a parent doesn't cascade-delete children, it orphans them to root, which is itself a discussion point, see flag below). `content` is `Json` (flexible per `ArtifactType`), plus `contentSize` (denormalized), `indexStatus`/`lastIndexedAt` (RAG pipeline state), and its own `deletedAt`. `@@unique([parentArtifactId, position])` enforces stable sibling ordering. `createdBy` is `Restrict`, `updatedBy` is `SetNull` — same audit-integrity pattern as `Project`.
- `Version` — belongs to one `Artifact` (`onDelete: Cascade`), `contentSnapshot: Json` (full copy, not a diff), monotonic `version: Int` unique per artifact (`@@unique([artifactId, version])`), `createdBy` is `Restrict`. Indexed descending on `(artifactId, version)` and `(artifactId, createdAt)` for "get latest version" queries.
- `Comment` — belongs to one `Artifact` (`onDelete: Cascade`) and one `User` (`onDelete: Cascade`), self-referential threading via `parentCommentId` (`onDelete: Cascade` — deleting a parent comment cascade-deletes its replies, notably the *opposite* choice from the new schema's `Comment.parentComment`, which switches to `Restrict`; see `002` for that comparison). Has `selectionMetadata: Json?` for anchoring a comment to a text range, and `isResolved: Boolean`. **This model has no corresponding controller/service/repository/route anywhere in `apps/api/src`** — confirmed by an exhaustive file listing of that directory.
- `VectorEmbedding` — belongs to both an `Artifact` and a `Project` (denormalized dual FK, both `onDelete: Cascade`), `embedding Unsupported("vector(768)")` (pgvector), `contentHash` for idempotent re-embedding, unique on `(artifactId, chunkIndex)` and on `(artifactId, embeddingModel, contentHash)`. The schema's own comment notes the HNSW index isn't expressible in Prisma's schema language and was added by hand via raw SQL migration. **Also has no corresponding application code (no indexing worker, no embedding-generation client, no search endpoint) anywhere in `apps/api/src`.**

**Cascade philosophy, as documented directly in the schema's own trailing comments:** `Cascade` is used wherever child data is meaningless without its parent (Session/Account/WorkspaceMember/Project/Artifact/Version/Comment); `Restrict` is used specifically to protect audit trails on `createdBy` FKs (`Artifact.createdBy`, `Version.createdBy`, `Project.createdBy`) so a user can't be deleted out from under content they authored; `SetNull` is used for `updatedBy` FKs and `Artifact.parentArtifactId`, on the reasoning that "last editor" and tree position are metadata, not ownership.

**Suspicious/notable schema decisions worth flagging (not fixed here, per task scope):**
- `Workspace.ownerId` is `onDelete: Cascade`. Deleting the single owning `User` row silently deletes the entire workspace and everything inside it (all projects, artifacts, versions, comments, embeddings) for every member — a much bigger blast radius than deleting a `Project.createdBy` user (which is `Restrict`ed specifically to prevent this class of accidental data loss). This is an inconsistency in the schema's own stated cascade philosophy.
- `User.role` in the OLD schema is a bare `String` with a string default `"USER"`, not an enum — the schema's own top-of-file comment for the (unrelated) `WorkspaceRole` enum specifically argues for enums "to prevent typos (Admin vs admin)" and "enforce strict RBAC at the DB level," yet `User.role` doesn't follow that same rule. Combined with the fact that no code path in `apps/api/src` reads this field, it currently functions as dead schema.
- `Artifact.parentArtifactId` is `onDelete: SetNull`, meaning deleting a parent page silently promotes all of its children to root-level artifacts rather than deleting or reparenting them explicitly — this may or may not be the intended UX, but the application layer (`artifactService.delete`) does implement its own explicit cascading **soft**-delete of descendants (`findDescendantIds` + `softDeleteMany`) that runs independently of and in addition to this DB-level `SetNull`, so soft-deleting a parent artifact soft-deletes children as an app-level guarantee even though the DB-level FK behavior alone would not.
- `Comment.parentCommentId` is `onDelete: Cascade` in the OLD schema (deleting a parent comment deletes its whole reply thread) — this is a real design decision with UX implications (an author deleting their own top-level comment silently destroys other users' replies to it) that is unimplemented today (no Comment feature exists in `apps/api/src`), so it has never actually been exercised.
- `VectorEmbedding` denormalizes both `artifactId` and `projectId` even though `projectId` is always derivable from `artifactId` via `Artifact.projectId` — a reasonable read-optimization for "all embeddings in project X" queries, but it does mean `projectId` must be kept manually in sync if an artifact is ever reparented across projects (reparenting across projects doesn't appear to be supported by `artifactService.update`, which only validates the new parent is in the *same* project — `validateParent` in `apps/api/src/services/artifact.service.ts` lines 195-242 — so this risk is currently latent, not exercised).
- Two independent versioning throttles exist in `version.service.ts`: `recordVersion` (always creates a version — used on create/restore) and `recordVersionIfDue` (only creates a version if ≥10 minutes have passed since the last one AND content actually changed — used on every `PATCH` update). This means intermediate edits within the same 10-minute window are never captured as a distinct version; only the final state before the window elapses is. This is a deliberate autosave-throttling tradeoff, not a bug, but worth knowing since it means "version history" is not a record of every save.
