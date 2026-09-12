import type { Article, Comment, Submission, TechRead } from "@repo/database";

// GET /articles/:id, GET /articles/slug/:slug (and the TechRead equivalents) join in the full
// Markdown body of the currently-live version — see apps/api/src/repositories/article.repository.ts's
// `includeCurrentSubmission` option. List endpoints never include this (title/summary/status are
// already denormalized onto the row itself), so this extended shape is only used by single-item
// detail queries.

export type ArticleWithSubmission = Article & {
  currentSubmission: Submission | null;
};

export type TechReadWithSubmission = TechRead & {
  currentSubmission: Submission | null;
};

// GET .../comments joins in a minimal author projection — see
// apps/api/src/repositories/comment.repository.ts's `list` (`select: { id, name, image }`).

export type CommentWithUser = Comment & {
  user: { id: string; name: string; image: string | null };
};

// POST /articles (and POST /tech-reads) create the parent row + its v1 Submission together in one
// transaction and return both — see article.service.ts::create / tech-read.service.ts::create.

export interface CreateArticleResult {
  article: Article;
  submission: Submission;
}

export interface CreateTechReadResult {
  techRead: TechRead;
  submission: Submission;
}
