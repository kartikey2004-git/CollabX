import db from "../db";
import type { Article, Role } from "../db";
import { Prisma } from "../db";
import type { CreateArticleInput, ListArticlesAdminQuery, ListArticlesQuery } from "../validation";
import { articleRepository } from "../repositories/article.repository";
import { submissionRepository } from "../repositories/submission.repository";
import { sanitizeMarkdownText } from "./markdown.service";
import { ConflictError, ForbiddenError, NotFoundError } from "../errors";
import { getOrSetCache, invalidateCache } from "../cache";

const LIST_CACHE_TTL_SECONDS = 30;

// Turns a title into a URL-friendly base slug, e.g. "My Cool Article!" -> "my-cool-article".
// Same approach the OLD product used for Project.slug (see 000-project-analysis.md).
function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Finds the first free `<base>`, `<base>-2`, `<base>-3`, ... slug. This has a benign TOCTOU race
// under concurrent creation of two articles with the same title (both requests could see the same
// candidate as free before either commits) — the transaction below catches the resulting P2002 and
// surfaces it as a 409 rather than crashing, since `Article.slug` is `@unique` at the DB level.
async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || "article";
  let candidate = base;
  let suffix = 2;

  while (await articleRepository.slugExists(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix++;
  }

  return candidate;
}

function isOwnerOrAdmin(row: { createdBy: string }, user: { id: string; role: Role }): boolean {
  return row.createdBy === user.id || user.role === "ADMIN";
}

export const articleService = {
  /*

  Creates an Article + its initial (v1) Submission together in one transaction — mirrors
  artifactService.create's "parent + first child row" pattern from the OLD product. The Article
  row's title/summary are seeded from the input here (required — the column is NOT NULL and there
  is no published version yet to denormalize from) but are never touched again by any path other
  than submission.service.ts's publish transaction; an already-published article's displayed
  title/summary stay whatever was last published even while a newer pending edit exists.

  */
  async create(userId: string, input: CreateArticleInput): Promise<{ article: Article; submission: Awaited<ReturnType<typeof submissionRepository.create>> }> {
    const slug = await generateUniqueSlug(input.title);

    try {
      return await db.$transaction(async (tx) => {
        const article = await articleRepository.create(
          {
            slug,
            category: input.category,
            title: input.title,
            summary: input.summary,
            createdBy: userId,
          },
          tx,
        );

        const submission = await submissionRepository.create(
          {
            parentType: "article",
            parentId: article.id,
            version: 1,
            title: input.title,
            summary: input.summary,
            content: sanitizeMarkdownText(input.content),
            submittedBy: userId,
          },
          tx,
        );

        return { article, submission };
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictError("An article with a conflicting slug already exists — please retry");
      }
      throw err;
    }
  },

  // Public, PUBLISHED-only listing — reachable by any authenticated Role (ALL_ROLES). Cached: this
  // query's result doesn't depend on who's asking (unlike getById/getBySlug below, which have a
  // requester-dependent visibility check and are deliberately NOT cached), so it's safe to serve
  // the same cached page to every caller for a short TTL.
  list(query: ListArticlesQuery) {
    const cacheKey = `articles:list:${JSON.stringify(query)}`;
    return getOrSetCache(cacheKey, LIST_CACHE_TTL_SECONDS, () =>
      articleRepository.findPublished({
        category: query.category,
        cursor: query.cursor,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      }),
    );
  },

  // GET /articles/mine — a CONTRIBUTOR sees only their own articles (any status); an ADMIN sees
  // every non-deleted article platform-wide (the moderation-adjacent view). Which mode applies is
  // decided from `requester.role`, never from a client-suppliable field, so a CONTRIBUTOR can never
  // pass a parameter to see someone else's drafts.
  listMine(requester: { id: string; role: Role }, query: ListArticlesAdminQuery) {
    return articleRepository.findForOwnerOrAdmin({
      createdBy: requester.role === "ADMIN" ? undefined : requester.id,
      status: query.status,
      category: query.category,
      cursor: query.cursor,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  },

  /*

  Fetch one article by id. PUBLISHED articles are visible to anyone; a DRAFT/PENDING_REVIEW/
  REJECTED article is only visible to its own creator or an ADMIN.

  This throws NotFoundError only when the row genuinely doesn't exist (or is soft-deleted) —
  visibility failures throw ForbiddenError instead. This deliberately does NOT reuse the OLD
  product's "404-over-403, hide existence from non-members" trick: 002-architecture-impact.md
  explicitly calls that OLD behavior out as having "no equivalent need in the new model" now that
  there's no per-resource membership to hide, and NotFoundError is reserved for "a genuinely
  missing/soft-deleted id." An unpublished Article's id was, in every real flow, only ever reachable
  by someone who already knows it exists (its own creator, or an admin browsing the moderation
  queue) — there's no scenario here analogous to a random user probing workspace ids they were never
  told about, so hiding existence would add complexity without a real threat it defends against.

  */
  async getById(id: string, requester: { id: string; role: Role }): Promise<Article> {
    const article = await articleRepository.findById(id, { includeCurrentSubmission: true });

    if (!article) {
      throw new NotFoundError("Article not found");
    }

    if (article.status !== "PUBLISHED" && !isOwnerOrAdmin(article, requester)) {
      throw new ForbiddenError("This article has not been published yet");
    }

    return article;
  },

  async getBySlug(slug: string, requester: { id: string; role: Role }): Promise<Article> {
    const article = await articleRepository.findBySlug(slug, { includeCurrentSubmission: true });

    if (!article) {
      throw new NotFoundError("Article not found");
    }

    if (article.status !== "PUBLISHED" && !isOwnerOrAdmin(article, requester)) {
      throw new ForbiddenError("This article has not been published yet");
    }

    return article;
  },

  // Soft-delete only — ADMIN-only (enforced by the route's requireRole(ADMIN_ONLY), not
  // re-checked here). Judgment call: the creator alone cannot delete their own article, even a
  // still-DRAFT one, since Article is the shared moderation record other admins may already be
  // looking at; this mirrors "only ADMIN moderates" being the platform's single source of removal
  // authority, same as publish/reject. See 004-backend-changes.md for the full reasoning.
  async delete(id: string): Promise<Article> {
    const article = await articleRepository.findById(id);
    if (!article) {
      throw new NotFoundError("Article not found");
    }
    const deleted = await articleRepository.softDelete(id);
    await invalidateCache("articles:list:");
    return deleted;
  },

  // Used by submission.service.ts to check "is this caller allowed to create a new version against
  // this article" without duplicating the owner/ADMIN rule in two places.
  async assertOwnerOrAdmin(articleId: string, requester: { id: string; role: Role }): Promise<void> {
    const ownerId = await articleRepository.findOwnerId(articleId);
    if (ownerId === null) {
      throw new NotFoundError("Article not found");
    }
    if (ownerId !== requester.id && requester.role !== "ADMIN") {
      throw new ForbiddenError("Only the article's creator or an admin may submit a new version");
    }
  },
};
