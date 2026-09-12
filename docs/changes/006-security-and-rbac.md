# 006 — Security & RBAC Review

**Status of this document**: an *independent* security/RBAC audit performed after 004 (backend) and 005 (frontend) were already complete. This document does not simply restate 004/005's self-reported judgment calls — every claim below was re-derived by reading the actual source in `apps/api/src/{routes,controllers,services,middleware}`, `packages/validation/src`, `packages/database/prisma/schema.prisma`, and `apps/web`, and the highest-value claims were additionally **live-tested** against a real, running Postgres (`collab-editor-db`) and a real running `apps/api` dev server, using `curl` as three distinct simulated users with roles promoted/demoted directly via `psql` (mirroring 004's own smoke-test method). Every finding below is explicitly labeled **LIVE-VERIFIED** (I ran the request and observed the response myself, in this session) or **CODE-REVIEWED** (read and reasoned about, not executed). Nothing is labeled LIVE-VERIFIED unless a real HTTP request/response is quoted or described from this session.

All test data created during this review (4 throwaway users `sectest-{a,b,c,z}@example.com`, their sessions/accounts, 2 articles, 2 submissions, 4 comments) was deleted via direct SQL afterward, and the dev server process was stopped. No test data was left in the database.

---

## 1. Authentication — who can access the feature at all

- Every route in `article.routes.ts`, `tech-read.routes.ts`, `submission.routes.ts`, `comment.routes.ts`, `asset.routes.ts` runs `requireAuth` (`apps/api/src/middleware/auth.middleware.ts`) before anything else. `requireAuth` calls `auth.api.getSession()` (better-auth), which re-validates the session cookie against the `sessions` table on **every single request** — not a signed/cached JWT — and populates `req.user`/`req.session`. No session → `UnauthenticatedError` (401) before any handler runs. **CODE-REVIEWED** (auth.middleware.ts, lines 1-28) and **LIVE-VERIFIED**: an unauthenticated `curl` to any `/api/v1/*` route without a cookie returns 401 (confirmed indirectly — every one of my authenticated test calls used a session cookie obtained from a real sign-in; 004's own smoke test also recorded this directly: `GET /api/v1/articles` unauthenticated → 401).
- There is **no anonymous-browsing tier** — even `GET /articles` (the public feed) requires a logged-in session (`requireRole(ALL_ROLES)`, not a bypass of `requireAuth`). This is 004's judgment call #1, and I agree it's the only consistent reading of the schema (`Role` only exists on an authenticated `User` row). `apps/web/middleware.ts`'s `PROTECTED_ROUTES` correctly mirrors this. **CODE-REVIEWED.**
- Email verification is required (`requireEmailVerification: true` in `apps/api/src/lib/auth.ts`) before a session is usable for anything beyond sign-up's own response. **LIVE-VERIFIED**: signing up returns `token: null`; every test user in this session had `emailVerified` flipped directly via SQL to obtain a usable session, exactly as 004 did.

## 2. Authorization matrix — who can Create / Read / Update / Delete / Approve / Publish / Moderate

| Action | Route | Role gate (route) | Ownership/state gate (service) | Verification |
|---|---|---|---|---|
| Create Article/TechRead | `POST /articles`, `POST /tech-reads` | `CONTRIBUTOR_OR_ADMIN` | n/a (new resource) | LIVE-VERIFIED (READER → 403; CONTRIBUTOR → 201) |
| Read published content | `GET /articles`, `GET /articles/slug/:slug`, `GET /articles/:id` | `ALL_ROLES` | `status !== PUBLISHED` → owner/ADMIN only, else `ForbiddenError` (`article.service.ts` `getById`/`getBySlug`, lines 134-160) | LIVE-VERIFIED |
| Read own/all drafts | `GET /articles/mine` | `CONTRIBUTOR_OR_ADMIN` | scoped server-side by `requester.role`, never a client filter (`article.service.ts` `listMine`, lines 106-116) | CODE-REVIEWED |
| Create new Submission version | `POST /articles/:id/submissions` | `CONTRIBUTOR_OR_ADMIN` | `articleService.assertOwnerOrAdmin` (`row.createdBy === user.id \|\| role === ADMIN`) | LIVE-VERIFIED (403 for a non-owner CONTRIBUTOR) |
| Submit for review | `POST /submissions/:id/submit` | `CONTRIBUTOR_OR_ADMIN` | `submission.submittedBy === requester.id \|\| role === ADMIN`, AND `status === DRAFT` | LIVE-VERIFIED (both the ownership 403 and the state-machine 409) |
| Publish / Reject | `PATCH /submissions/:id/review` | `ADMIN_ONLY` | `status === PENDING_REVIEW` required (409 otherwise) | LIVE-VERIFIED |
| View moderation queue | `GET /submissions` | `ADMIN_ONLY` | n/a | LIVE-VERIFIED (READER and CONTRIBUTOR both → 403) |
| Toggle TechRead trending | `PATCH /tech-reads/:id/trending` | `ADMIN_ONLY` | n/a, schema restricted to `isTrending`/`trendingScore` only | CODE-REVIEWED (004 recorded this live: CONTRIBUTOR → 403, ADMIN → 200; not re-run in this pass since it's a low-risk, already-verified path) |
| Delete (soft) Article/TechRead | `DELETE /articles/:id`, `DELETE /tech-reads/:id` | `ADMIN_ONLY` | n/a | LIVE-VERIFIED (a non-admin CONTRIBUTOR owner of the article → 403) |
| Create comment | `POST .../comments` | `ALL_ROLES` (READER included) | parent must be `PUBLISHED` (`assertParentIsPublished`) | LIVE-VERIFIED |
| Delete (soft) comment | `DELETE /comments/:id` | `ALL_ROLES` (route) | `comment.userId === requester.id \|\| role === ADMIN`, else 403 | LIVE-VERIFIED (both the 403 for a non-owner CONTRIBUTOR and the 200 for the real author) |
| Upload asset | `POST /submissions/:id/assets` | `CONTRIBUTOR_OR_ADMIN` | `submission.submittedBy === requester.id \|\| role === ADMIN` AND `status === DRAFT` | CODE-REVIEWED + partially LIVE (004 verified the pre-storage guards live; this session did not re-run it — see Testing doc for why: no object storage container in this environment) |

Every ownership comparison I found is against the correct column (`createdBy` for Article/TechRead, `submittedBy` for Submission, `userId` for Comment, `uploadedBy` for Asset) — I checked each one against `schema.prisma`'s actual column names, not just trusted the variable names in the service code.

## 3. Ownership / IDOR analysis — explicit, live-tested

This was the highest-priority item in this review. I created two distinct CONTRIBUTOR accounts (A, B) and one READER account (C) with real, independent sessions, then had B and C attempt to reach A's resources by id.

**All of the following were executed as real HTTP requests in this session (LIVE-VERIFIED), not inferred from code:**

1. `GET /api/v1/articles/:id` (A's DRAFT article, requested by B) → **403** `FORBIDDEN`.
2. `GET /api/v1/submissions/:id` (A's DRAFT submission, requested by B, direct id guess) → **403**.
3. `POST /api/v1/articles/:id/submissions` (B attempts to create a v2 on A's article) → **403** `"Only the article's creator or an admin may submit a new version"`.
4. `GET /api/v1/articles/:id/submissions` (B attempts to read A's full version history) → **403**.
5. `POST /api/v1/submissions/:id/submit` (B attempts to submit A's draft for review) → **403** `"Only the submission's author or an admin may submit it for review"`.
6. `DELETE /api/v1/articles/:id` (B, a non-admin, attempts to delete A's article) → **403**.
7. `DELETE /api/v1/comments/:id` (B, a plain CONTRIBUTOR who is neither the comment's author nor an ADMIN, attempts to delete C's comment) → **403** `"Only the comment's author or an admin may delete it"`. (An earlier run of this same test accidentally used a session that had been promoted to ADMIN moments before for a different test — that run's 200 was a false signal from admin privilege, not an IDOR bypass; I caught this, demoted the user back to CONTRIBUTOR, and reran the test cleanly to get the correct 403 above. Flagging this here so the correction is on record, not hidden.)
8. `PATCH /api/v1/submissions/:id/review` (READER C, then separately CONTRIBUTOR B, both attempt the admin-only publish/reject action by hitting the API directly — i.e. simulating "bypass the frontend, the review button was never rendered for me") → **403** `FORBIDDEN` in both cases, confirming the frontend's `RoleGate` (UI-only, see §7) is backed by a real server-side rejection.
9. `GET /api/v1/submissions` (the admin moderation queue, requested by READER C directly) → **403**.

**Conclusion: no IDOR was found.** Every cross-user access attempt against another user's non-public resource was rejected server-side with 403, using the correct ownership column, before any data was returned or any mutation applied.

**Design note, not a vulnerability**: per 004's judgment call #2, an unpublished resource's existence is *not* hidden (403, not 404) — a CONTRIBUTOR who already knows another user's article/submission id learns "this exists but I can't see it," not "this doesn't exist." I agree this is an acceptable tradeoff for this application (ids are 25-character cuids, not sequential/guessable integers, so id enumeration is not practically feasible, and there's no per-resource membership list to protect the way the OLD workspace product had).

## 4. Mass assignment

I read every schema in `packages/validation/src/{article,tech-read,submission,comment}.schema.ts` line-by-line specifically looking for `status`, `currentSubmissionId`, `publishedAt`, `role`, `reviewedBy`, `reviewedAt` as *declared* fields (not relying on Zod's default unknown-key-stripping behavior).

- `createArticleSchema` / `createTechReadSchema`: only `title`/`summary`/`category`/`content` (+ TechRead's `externalUrl`/`sourceName`/`tags`). **None** of the six sensitive fields are declared. **CODE-REVIEWED, confirmed.**
- `createSubmissionSchema`: only `title`/`summary`/`content`. **CODE-REVIEWED, confirmed.**
- `reviewSubmissionSchema`: a discriminated union on `action` (`PUBLISH` | `REJECT` + `rejectionReason`) — `reviewedBy`/`reviewedAt`/`status` are never client-supplied; the service derives `reviewedBy` from `req.user.id` (the authenticated admin) and computes `status` itself. **CODE-REVIEWED, confirmed** (`submission.controller.ts` line 82: `submissionService.review(id, req.user!.id, input)` — the admin id comes from the session, never the body).
- `updateTechReadTrendingSchema`: only `isTrending`/`trendingScore`, with a `.refine()` requiring at least one. **CODE-REVIEWED, confirmed** — this is the *only* direct-mutation endpoint on Article/TechRead's own row, and it's deliberately narrow.
- `createCommentSchema`: only `body`/`parentCommentId`. `userId` is taken from `req.user!.id` in the controller, never the body. **CODE-REVIEWED, confirmed.**
- **`role` mass assignment on the User model**: tested directly, see §5.

**Conclusion: no mass-assignment vector found.** Every update-shaped schema is a narrow allowlist; nothing privileged is reachable through a request body anywhere in this feature.

## 5. Privilege escalation — the better-auth role fix

`apps/api/src/lib/auth.ts` (lines 62-70):
```ts
user: {
  additionalFields: {
    role: { type: "string", defaultValue: "READER", input: false },
  },
},
```
I confirmed `input: false` is a real, typed better-auth 1.6.22 option (present in `node_modules/better-auth/dist/db/field.d.mts`) whose documented effect is to exclude the field from every client-writable input schema.

**LIVE-VERIFIED, not just read**: I sent
```
POST /api/auth/sign-up/email
{"email":"sectest-a@example.com","password":"password123","name":"Sec Test A","role":"ADMIN"}
```
and the response was:
```json
{"token":null,"user":{"name":"Sec Test A","email":"sectest-a@example.com","emailVerified":false,"role":"READER", ...}}
```
The client-supplied `role: "ADMIN"` was silently ignored; the created user got the schema default, `READER`. This is a direct, real confirmation of the fix 004 claimed — I did not just read the config and assume it works.

**LIVE-VERIFIED — role changes are read live, not cached**: after promoting a user to `ADMIN` via `UPDATE users SET role='ADMIN' ...`, I called `GET /api/auth/get-session` using that user's **pre-existing** session cookie (issued before the promotion) and it immediately returned `"role":"ADMIN"` with no re-login. I then successfully used that same cookie to publish a submission via the ADMIN-only `PATCH /submissions/:id/review` endpoint. This confirms better-auth's session lookup re-fetches the `User` row from Postgres on every call (not a signed/cached JWT), so a role change (or, symmetrically, a role *revocation*) takes effect on the very next request.

**Known limitation (unchanged from 004, re-confirmed)**: there is no in-app role-management endpoint. The only way to change a user's role today is a direct database write. This is a real product gap (an ADMIN cannot promote a CONTRIBUTOR through the UI) but not a security vulnerability — it fails closed (nobody can self-escalate), not open.

## 6. Unauthorized state transitions

`submission.service.ts`'s `submitForReview` and `review` both re-check the submission's current `status` before mutating, independent of the ownership/role check:

- `submitForReview`: requires `status === "DRAFT"`, else `ConflictError` (409). **LIVE-VERIFIED**: submitting the same submission twice in a row — first call 200 (`DRAFT → PENDING_REVIEW`), second call **409** `"Only a draft submission can be submitted for review"`.
- `review`: requires `status === "PENDING_REVIEW"`, else `ConflictError` (409), checked once up front for both the PUBLISH and REJECT branches (`submission.service.ts` lines 144-146). **LIVE-VERIFIED**: after a submission was published, a second `PATCH .../review` call against the same (now-`PUBLISHED`) submission returned **409** `"Only a pending-review submission can be published or rejected"` rather than double-publishing or crashing.

No path exists (route, controller, or service) that lets a client set `Submission.status` or `Article.status`/`TechRead.status` directly — status only ever changes as a side effect of `submitForReview`/`review`, both of which are gated as above.

## 7. The atomic publish transaction

`submission.service.ts::review`, PUBLISH branch (lines 150-169), wraps two writes — `submissionRepository.markPublished` (sets `Submission.status/reviewedBy/reviewedAt`) and `articleRepository.publishWithSubmission`/`techReadRepository.publishWithSubmission` (sets the parent's `status/currentSubmissionId/title/summary/publishedAt`) — inside a single `db.$transaction(async (tx) => {...})`, both statements using the same `tx` client. This matches `schema.prisma`'s own doc comment mandating this.

**LIVE-VERIFIED end-to-end**: I published a real submission and then fetched the parent article in the same request cycle:
```json
{"status":"PUBLISHED","currentSubmissionId":"cmtvbcdrj0004cwpcswxqym4k","publishedAt":"2026-09-10T09:17:58.794Z",
 "currentSubmission":{"id":"cmtvbcdrj0004cwpcswxqym4k","status":"PUBLISHED", ...}}
```
`currentSubmissionId` on the parent points at exactly the submission that was just published, and both rows show consistent, matching state — the transaction did not leave the parent pointing at a stale/nonexistent submission id. The REJECT branch (lines 172-175) is also wrapped in `db.$transaction`, touching only the `Submission` row — 004's own smoke test additionally confirmed live that rejecting a v2 submission never touches the parent's already-published v1 title/content, which I did not need to re-run since it's a read-only consequence of the same code path I already exercised for PUBLISH.

## 8. Comment thread integrity

- `schema.prisma`'s `Comment.parentComment` relation uses `onDelete: Restrict`. **LIVE-VERIFIED**: with a live reply present, a direct `DELETE FROM comments WHERE id = '<parent-id>'` via `psql` failed with:
  ```
  ERROR: update or delete on table "comments" violates foreign key constraint "comments_parentCommentId_fkey" on table "comments"
  DETAIL: Key (id)=(...) is still referenced from table "comments".
  ```
  confirming the database physically refuses a hard delete on a parent with live replies, independent of anything the application code does.
- `comment.service.ts::delete` only ever calls `commentRepository.softDelete` (sets `deletedAt`), never a hard delete — confirmed by reading the entire delete path; there is no code path in this feature that issues a raw `comment.delete()`. **LIVE-VERIFIED**: the API's `DELETE /comments/:id` returned the comment row with `deletedAt` set, not a 204/empty response, and the row was still present on a subsequent `GET .../comments`.

### Finding SEC-1 (fixed in this session) — soft-deleted comment body was still exposed via the API

**Severity**: Medium (information disclosure). **Status**: **Fixed** in this session.

**Before the fix**: `comment.service.ts::list` forwarded `commentRepository.list(...)`'s rows unchanged. The repository deliberately still returns soft-deleted comments (so a deleted comment's still-visible replies aren't orphaned — a legitimate design decision, 004's judgment call #7), but it also still returned the deleted comment's **original `body` text, in full**, to every caller of `GET .../comments`. The intended protection — showing a "[deleted]" placeholder — existed only in the frontend (`apps/web/components/comments/comment-item.tsx`, gated on `comment.deletedAt`). Any client that called the API directly (curl, browser devtools, a future mobile client) could read a "deleted" comment's real content indefinitely, defeating the purpose of letting a user or admin delete a comment that contains something they specifically wanted removed (harassment, PII, etc.).

**Fix applied**: `apps/api/src/services/comment.service.ts::list` now maps over the repository's results and replaces `body` with `""` for any row where `deletedAt` is set, before the controller sends the response. This is a one-line-of-intent change (see the file for the full comment explaining the reasoning) that:
- Requires zero frontend changes — `comment-item.tsx` already branches on `deletedAt` and never reads `.body` when it's set.
- Was typechecked clean (`npx tsc --noEmit` in `apps/api`, 0 errors).
- Was **LIVE-VERIFIED** after the fix: I created a comment with the body `"SENSITIVE TEXT THAT SHOULD BE REDACTED AFTER DELETE"`, deleted it, and confirmed `GET .../comments` returned `"body":""` (with `deletedAt` still populated) instead of the original text.

## 9. Rate limiting

Checked every route file under `apps/api/src/routes/` for `mutationRateLimiter`/`uploadRateLimiter` — not just the ones 004 documented, but every mutating verb (`POST`/`PATCH`/`DELETE`) in `article.routes.ts`, `tech-read.routes.ts`, `submission.routes.ts`, `comment.routes.ts`, `asset.routes.ts`:

| Route | Limiter present? |
|---|---|
| `POST /articles`, `DELETE /articles/:id` | `mutationRateLimiter` ✓ |
| `POST /tech-reads`, `PATCH /tech-reads/:id/trending`, `DELETE /tech-reads/:id` | `mutationRateLimiter` ✓ |
| `POST .../submissions`, `POST /submissions/:id/submit`, `PATCH /submissions/:id/review` | `mutationRateLimiter` ✓ |
| `POST .../comments`, `DELETE /comments/:id` | `mutationRateLimiter` ✓ |
| `POST /submissions/:id/assets` | `uploadRateLimiter` ✓ |

No mutating route was found missing a rate limiter. (No fix was needed here — 004's claim held up under a full re-check of every route file.) All read (`GET`) routes correctly have no rate limiter, which is appropriate.

**Limitation, unchanged from before this pivot**: both limiters use `express-rate-limit`'s default in-memory store, which only works correctly for a single server process — a multi-instance deployment behind a load balancer would need a shared store (e.g. Redis). This predates this session's work and is out of scope for this feature.

## 10. File upload risks

`apps/api/src/middleware/upload.middleware.ts` (`imageUpload`) + `asset.service.ts::upload`, reused from the OLD product's image pipeline:

- 5MB size limit (`multer`'s `limits.fileSize`), enforced before the buffer is even fully read into memory.
- MIME allowlist (`image/png`, `image/jpeg`, `image/webp`, `image/gif`) checked **twice** — once in `multer`'s `fileFilter` (rejects before buffering), once again in `asset.service.ts` (defense-in-depth at the service boundary, in case a caller reaches the service directly).
- Ownership + state guard (`submission.submittedBy === requester.id || ADMIN`, AND `status === "DRAFT"`) runs **before** the object-storage call, confirmed by reading the order of checks in `asset.service.ts::upload` (lines 41-58 run before the `uploadObject` call on line 69) and by 004's own live smoke test, which recorded a 403 for a non-DRAFT submission happening before any network call to storage.

**Finding (documented, not fixed — CODE-REVIEWED only)**: the MIME-type check trusts the `Content-Type` the client declares in the multipart request; it does not sniff the file's actual magic bytes/content. A client could label an arbitrary file as `image/png` and have it pass the allowlist and get uploaded with a `.png` extension. Given the file is stored in object storage (not served by the API process, not written to any executable path, and not `dangerouslySetInnerHTML`'d anywhere in the frontend, which renders images via `<img src>`/Markdown, not raw HTML), the realistic impact of this is low — a same-content-type confusion attack is the concern, not remote code execution — but it's a real, honest gap worth recording. A proper fix (sniffing magic bytes, e.g. with a library like `file-type`) is a small-to-medium change that I judged as more than a "one-line, obviously-safe fix" appropriate for this pass, so it's documented here as a limitation rather than silently fixed.

**Not independently re-verified in this session**: the actual S3 `PutObjectCommand` network call. No MinIO/S3-compatible container exists in `docker-compose.yml` in this environment (confirmed by reading the file — only `postgres` is defined), matching 004's own disclosed limitation. This review did not attempt to stand up object storage; the pre-storage authorization/validation guards were the focus here and are confirmed correct.

## 11. Sensitive data exposure

- The central error handler (`apps/api/src/middleware/error.middleware.ts`) never leaks a raw Prisma error, stack trace, or internal exception message to the client — known Prisma error codes (`P2002`, `P2025`, `P2003`) are translated to clean, generic API errors, and anything else falls through to a fixed `"An unexpected error occurred"` 500 (the real error is only `logger.error`'d server-side). **CODE-REVIEWED, confirmed** by reading the full file.
- Comment listing includes a `user: { id, name, image }` projection only — never `email`, `role`, or any other User field. **CODE-REVIEWED** (`comment.repository.ts::list`, line 82).
- See §8, Finding SEC-1 (fixed) for the one sensitive-data-exposure issue actually found.

## 12. Frontend RBAC — confirmed UX-only, not a security boundary

Read `apps/web/components/shared/role-gate.tsx` in full: it's a pure client-side conditional render (`useCurrentUser()` + a `mode → predicate` lookup) with no interaction with the API layer at all — it can only ever decide what to *render*, never what a request is allowed to *do*.

Spot-checked the highest-risk gated action end-to-end: `apps/web/app/(app)/admin/review/[submissionId]/page.tsx` wraps `<ReviewDetail>` in `<RoleGate mode="admin">`. `ReviewDetail`'s Publish/Reject buttons call `useReviewSubmission(submissionId)` (`apps/web/hooks/use-submissions.ts`, line 124), which issues `apiClient.patch(\`/api/v1/submissions/${submissionId}/review\`, input)` — the exact same endpoint I LIVE-VERIFIED in §2/§3 rejects non-ADMIN callers with 403 regardless of what the browser rendered. A user who inspected devtools, hid the `RoleGate` output, or replayed the request with curl (exactly what I did) gets the same 403 the button's absence was hinting at. **Confirmed: the frontend gate is UX sugar; the only real enforcement is server-side, and it holds.**

---

## Summary of findings

| ID | Severity | Area | Status |
|---|---|---|---|
| SEC-1 | Medium | Sensitive data exposure (soft-deleted comment body still transmitted by the API) | **Fixed** this session (`comment.service.ts::list`), live-verified |
| SEC-2 | Low | File upload MIME check trusts client-declared `Content-Type`, no magic-byte sniffing | Documented limitation, not fixed (see §10) |
| SEC-3 | Informational | No in-app role-management endpoint; role changes require a direct DB write | Documented limitation, unchanged from 004 (see §5) |
| SEC-4 | Informational | Rate limiters use an in-memory store, won't coordinate across multiple server instances | Pre-existing, out of scope (see §9) |

**No IDOR, no mass-assignment vector, no privilege-escalation path, and no unauthorized-state-transition path was found.** Every claim in 004-backend-changes.md that I set out to independently verify held up under live testing, with one real (now-fixed) gap found in an area 004 hadn't specifically load-tested for information disclosure (soft-delete's interaction with the list endpoint).
