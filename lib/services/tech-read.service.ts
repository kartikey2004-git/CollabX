import db from "../db";
import type { Role, TechRead } from "../db";
import { Prisma } from "../db";
import type { CreateTechReadInput, ListTechReadsAdminQuery, ListTechReadsQuery } from "../validation";
import { techReadRepository } from "../repositories/tech-read.repository";
import { submissionRepository } from "../repositories/submission.repository";
import { sanitizeMarkdownText } from "./markdown.service";
import { ConflictError, ForbiddenError, NotFoundError } from "../errors";
import { getOrSetCache, invalidateCache } from "../cache";

const LIST_CACHE_TTL_SECONDS = 30;

// Same slugify/uniqueness approach as article.service.ts — see that file's comments for the
// reasoning behind the benign TOCTOU race + P2002 fallback.
function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title) || "tech-read";
  let candidate = base;
  let suffix = 2;

  while (await techReadRepository.slugExists(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix++;
  }

  return candidate;
}

function isOwnerOrAdmin(row: { createdBy: string }, user: { id: string; role: Role }): boolean {
  return row.createdBy === user.id || user.role === "ADMIN";
}

export const techReadService = {
  // Creates a TechRead + its initial (v1) Submission together in one transaction. `description`
  // (the curator's short annotation, denormalized onto TechRead) and `content` (the curator's full
  // write-up, stored on the Submission) are deliberately separate fields — see
  // tech-read.schema.ts's comment on `createTechReadSchema` for why.
  async create(
    userId: string,
    input: CreateTechReadInput,
  ): Promise<{ techRead: TechRead; submission: Awaited<ReturnType<typeof submissionRepository.create>> }> {
    const slug = await generateUniqueSlug(input.title);

    try {
      return await db.$transaction(async (tx) => {
        const techRead = await techReadRepository.create(
          {
            slug,
            title: input.title,
            description: input.description,
            externalUrl: input.externalUrl,
            sourceName: input.sourceName,
            category: input.category,
            tags: input.tags,
            createdBy: userId,
          },
          tx,
        );

        const submission = await submissionRepository.create(
          {
            parentType: "techRead",
            parentId: techRead.id,
            version: 1,
            title: input.title,
            summary: input.description,
            content: sanitizeMarkdownText(input.content),
            submittedBy: userId,
          },
          tx,
        );

        return { techRead, submission };
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictError("A tech read with a conflicting slug already exists — please retry");
      }
      throw err;
    }
  },

  // Public, PUBLISHED-only listing.
  list(query: ListTechReadsQuery) {
    const cacheKey = `tech-reads:list:${JSON.stringify(query)}`;
    return getOrSetCache(cacheKey, LIST_CACHE_TTL_SECONDS, () =>
      techReadRepository.findPublished({
        category: query.category,
        cursor: query.cursor,
        limit: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      }),
    );
  },

  listMine(requester: { id: string; role: Role }, query: ListTechReadsAdminQuery) {
    return techReadRepository.findForOwnerOrAdmin({
      createdBy: requester.role === "ADMIN" ? undefined : requester.id,
      status: query.status,
      category: query.category,
      cursor: query.cursor,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  },

  // Same NotFoundError-vs-ForbiddenError split as articleService.getById — see that file's comment.
  async getById(id: string, requester: { id: string; role: Role }): Promise<TechRead> {
    const techRead = await techReadRepository.findById(id, { includeCurrentSubmission: true });

    if (!techRead) {
      throw new NotFoundError("Tech read not found");
    }

    if (techRead.status !== "PUBLISHED" && !isOwnerOrAdmin(techRead, requester)) {
      throw new ForbiddenError("This tech read has not been published yet");
    }

    return techRead;
  },

  async getBySlug(slug: string, requester: { id: string; role: Role }): Promise<TechRead> {
    const techRead = await techReadRepository.findBySlug(slug, { includeCurrentSubmission: true });

    if (!techRead) {
      throw new NotFoundError("Tech read not found");
    }

    if (techRead.status !== "PUBLISHED" && !isOwnerOrAdmin(techRead, requester)) {
      throw new ForbiddenError("This tech read has not been published yet");
    }

    return techRead;
  },

  // ADMIN-only (same judgment call as articleService.delete).
  async delete(id: string): Promise<TechRead> {
    const techRead = await techReadRepository.findById(id);
    if (!techRead) {
      throw new NotFoundError("Tech read not found");
    }
    const deleted = await techReadRepository.softDelete(id);
    await invalidateCache("tech-reads:list:");
    return deleted;
  },

  async assertOwnerOrAdmin(techReadId: string, requester: { id: string; role: Role }): Promise<void> {
    const ownerId = await techReadRepository.findOwnerId(techReadId);
    if (ownerId === null) {
      throw new NotFoundError("Tech read not found");
    }
    if (ownerId !== requester.id && requester.role !== "ADMIN") {
      throw new ForbiddenError("Only the tech read's creator or an admin may submit a new version");
    }
  },
};
