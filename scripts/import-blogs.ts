// One-off/idempotent import: pulls the author's existing blog posts from their public Markstack API
// and inserts them as PUBLISHED Article + v1 Submission pairs. Safe to re-run — upserts by slug.

import "dotenv/config";
import type { Category } from "../lib/generated/prisma/client";
import db from "../lib/db";

const SOURCE_URL = "https://markstack-app.vercel.app/api/public/blogs";

const OWNER_EMAIL = "kartikeybhatnagar247@gmail.com";
const OWNER_NAME = "Kartikey Bhatnagar";

interface SourceBlog {
  title: string;
  description: string;
  slug: string;
  content: string;
  htmlContent: string;
  readTime: number;
  createdAt: string;
  coverImage: string | null;
}

// Manually curated per post — the source API has no category, and this is a small enough set (28
// posts) that a hand-mapped table is more accurate than a keyword heuristic. Anything not listed
// here falls back to ENGINEER_ARTICLES.
const CATEGORY_BY_SLUG: Record<string, Category> = {
  "operation-based-crdts-for-ordered-sequences": "DISTRIBUTED_SYSTEMS",
  "backend-scaling-and-performance": "BACKEND_ENGINEERING",
  "from-localhost-to-production": "DEVOPS",
  "ai-is-building-faster-but-does-anyone-understand-what-it-built": "ENGINEER_ARTICLES",
  "why-your-api-should-never-wait-for-logging": "BACKEND_ENGINEERING",
  "backend-security-think-like-an-attacker-build-like-an-engineer": "BACKEND_ENGINEERING",
  "optimizing-tree-traversal-with-bfs": "ENGINEER_ARTICLES",
  "how-graceful-shutdown-works-in-production-backend-systems": "BACKEND_ENGINEERING",
  "how-modern-backends-are-debugged": "BACKEND_ENGINEERING",
  "backend-configuration-management-beyond-env-files": "BACKEND_ENGINEERING",
  "understanding-backend-concurrency-threads-event-loops-and-virtual-threads": "BACKEND_ENGINEERING",
  "error-handling-and-building-fault-tolerant-backends-an-engineering-approach": "BACKEND_ENGINEERING",
  "postgresql-vs-elasticsearch-understanding-search-at-scale": "BACKEND_ENGINEERING",
  "from-cloud-first-to-local-first-architectures-sync-and-crdts": "DISTRIBUTED_SYSTEMS",
  "local-first-architecture-building-applications-that-work-offline": "DISTRIBUTED_SYSTEMS",
  "caching-from-cpu-registers-to-distributed-systems": "DISTRIBUTED_SYSTEMS",
  "background-tasks-message-queues-building-resilient-asynchronous-backends": "BACKEND_ENGINEERING",
  "backend-databases-from-schema-to-scale": "BACKEND_ENGINEERING",
  "api-design-that-doesnt-break-at-scale": "BACKEND_ENGINEERING",
  "handlers-services-middleware-context": "BACKEND_ENGINEERING",
  "api-data-handling": "BACKEND_ENGINEERING",
  "rate-limiting": "BACKEND_ENGINEERING",
  "authentication-and-authorization": "BACKEND_ENGINEERING",
  "serialization-and-deserialization-data-flow-between-clients-and-servers": "BACKEND_ENGINEERING",
  "routing-in-web-applications-url-design-and-request-mapping": "BACKEND_ENGINEERING",
  "http-protocol-the-foundation-of-web-communication": "BACKEND_ENGINEERING",
  "what-is-a-backend-the-server-side-architecture": "BACKEND_ENGINEERING",
  "beyond-crud-the-backend-engineering-playbook": "BACKEND_ENGINEERING",
};

async function fetchBlogs(): Promise<SourceBlog[]> {
  const res = await fetch(SOURCE_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${SOURCE_URL}: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as SourceBlog[];
}

// Finds or creates the account every imported article/submission is attributed to. Promoted to
// ADMIN so the account can immediately create/moderate content (no self-service role upgrade
// exists yet — see apps/api/src/lib/auth.ts).
async function ensureOwner() {
  return db.user.upsert({
    where: { email: OWNER_EMAIL },
    update: { role: "ADMIN" },
    create: {
      name: OWNER_NAME,
      email: OWNER_EMAIL,
      emailVerified: true,
      role: "ADMIN",
    },
  });
}

async function importBlog(blog: SourceBlog, ownerId: string) {
  const category = CATEGORY_BY_SLUG[blog.slug] ?? "ENGINEER_ARTICLES";
  const publishedAt = new Date(blog.createdAt);
  const content = blog.content.replace(/\r\n/g, "\n");

  const existing = await db.article.findUnique({ where: { slug: blog.slug } });
  if (existing) {
    console.log(`  skip (already imported): ${blog.slug}`);
    return;
  }

  await db.$transaction(async (tx) => {
    const article = await tx.article.create({
      data: {
        slug: blog.slug,
        category,
        title: blog.title,
        summary: blog.description,
        status: "PUBLISHED",
        createdBy: ownerId,
        publishedAt,
        createdAt: publishedAt,
      },
    });

    const submission = await tx.submission.create({
      data: {
        articleId: article.id,
        version: 1,
        title: blog.title,
        summary: blog.description,
        content,
        status: "PUBLISHED",
        submittedBy: ownerId,
        submittedAt: publishedAt,
        reviewedBy: ownerId,
        reviewedAt: publishedAt,
        createdAt: publishedAt,
      },
    });

    await tx.article.update({
      where: { id: article.id },
      data: { currentSubmissionId: submission.id },
    });
  }, { timeout: 20000, maxWait: 15000 }); // Neon's pooled connection can take a moment to open a fresh transaction; the 5s default was too tight.

  console.log(`  imported: ${blog.slug} [${category}]`);
}

async function main() {
  console.log(`Fetching blogs from ${SOURCE_URL} ...`);
  const blogs = await fetchBlogs();
  console.log(`Fetched ${blogs.length} posts.`);

  const owner = await ensureOwner();
  console.log(`Owner: ${owner.email} (${owner.id}, role=${owner.role})`);

  for (const blog of blogs) {
    await importBlog(blog, owner.id);
  }

  console.log("Import complete.");
}

main()
  .catch((error) => {
    console.error("Import failed");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
