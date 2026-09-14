/*
  Warnings:

  - The `role` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `value` on the `verifications` table. All the data in the column will be lost.
  - The `type` column on the `verifications` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `documents` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `tokenHash` to the `verifications` table without a default value. This is not possible if the table is not empty.

*/
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CONTRIBUTOR', 'READER');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('BACKEND_ENGINEERING', 'FRONTEND_ENGINEERING', 'ENGINEER_ARTICLES', 'SYSTEM_DESIGN', 'DISTRIBUTED_SYSTEMS', 'INFRASTRUCTURE', 'DEVOPS');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "IndexStatus" AS ENUM ('NOT_INDEXED', 'INDEXING', 'INDEXED', 'STALE');

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_ownerId_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'READER';

-- AlterTable
ALTER TABLE "verifications" DROP COLUMN "value",
ADD COLUMN     "tokenHash" VARCHAR(255) NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "VerificationType" NOT NULL DEFAULT 'EMAIL_VERIFICATION';

-- DropTable
DROP TABLE "documents";

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "currentSubmissionId" TEXT,
    "createdBy" TEXT NOT NULL,
    "publishedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tech_reads" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "externalUrl" TEXT NOT NULL,
    "sourceName" TEXT,
    "category" "Category",
    "tags" TEXT[],
    "isTrending" BOOLEAN NOT NULL DEFAULT false,
    "trendingScore" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "currentSubmissionId" TEXT,
    "createdBy" TEXT NOT NULL,
    "publishedAt" TIMESTAMPTZ(3),
    "deletedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tech_reads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "articleId" TEXT,
    "techReadId" TEXT,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedBy" TEXT NOT NULL,
    "submittedAt" TIMESTAMPTZ(3),
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMPTZ(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "indexStatus" "IndexStatus" NOT NULL DEFAULT 'NOT_INDEXED',
    "lastIndexedAt" TIMESTAMPTZ(3),

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "articleId" TEXT,
    "techReadId" TEXT,
    "userId" TEXT NOT NULL,
    "parentCommentId" TEXT,
    "body" TEXT NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT,
    "mimeType" TEXT,
    "size" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "uploadedBy" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vector_embeddings" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "embeddingModel" TEXT NOT NULL,
    "contentHash" VARCHAR(64) NOT NULL,
    "tokenCount" INTEGER,
    "content" TEXT NOT NULL,
    "embedding" vector(768) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vector_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "articles_currentSubmissionId_key" ON "articles"("currentSubmissionId");

-- CreateIndex
CREATE INDEX "articles_category_status_idx" ON "articles"("category", "status");

-- CreateIndex
CREATE INDEX "articles_createdBy_idx" ON "articles"("createdBy");

-- CreateIndex
CREATE INDEX "articles_status_idx" ON "articles"("status");

-- CreateIndex
CREATE INDEX "articles_publishedAt_idx" ON "articles"("publishedAt");

-- CreateIndex
CREATE INDEX "articles_updatedAt_idx" ON "articles"("updatedAt");

-- CreateIndex
CREATE INDEX "articles_createdAt_idx" ON "articles"("createdAt");

-- CreateIndex
CREATE INDEX "articles_category_deletedAt_idx" ON "articles"("category", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "tech_reads_slug_key" ON "tech_reads"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "tech_reads_currentSubmissionId_key" ON "tech_reads"("currentSubmissionId");

-- CreateIndex
CREATE INDEX "tech_reads_isTrending_trendingScore_idx" ON "tech_reads"("isTrending", "trendingScore");

-- CreateIndex
CREATE INDEX "tech_reads_category_status_idx" ON "tech_reads"("category", "status");

-- CreateIndex
CREATE INDEX "tech_reads_createdBy_idx" ON "tech_reads"("createdBy");

-- CreateIndex
CREATE INDEX "tech_reads_status_idx" ON "tech_reads"("status");

-- CreateIndex
CREATE INDEX "tech_reads_publishedAt_idx" ON "tech_reads"("publishedAt");

-- CreateIndex
CREATE INDEX "tech_reads_createdAt_idx" ON "tech_reads"("createdAt");

-- CreateIndex
CREATE INDEX "submissions_articleId_status_idx" ON "submissions"("articleId", "status");

-- CreateIndex
CREATE INDEX "submissions_techReadId_status_idx" ON "submissions"("techReadId", "status");

-- CreateIndex
CREATE INDEX "submissions_status_submittedAt_idx" ON "submissions"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "submissions_submittedBy_idx" ON "submissions"("submittedBy");

-- CreateIndex
CREATE INDEX "submissions_reviewedBy_idx" ON "submissions"("reviewedBy");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_articleId_version_key" ON "submissions"("articleId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "submissions_techReadId_version_key" ON "submissions"("techReadId", "version");

-- CreateIndex
CREATE INDEX "comments_articleId_createdAt_idx" ON "comments"("articleId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "comments_techReadId_createdAt_idx" ON "comments"("techReadId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "comments_userId_idx" ON "comments"("userId");

-- CreateIndex
CREATE INDEX "comments_parentCommentId_idx" ON "comments"("parentCommentId");

-- CreateIndex
CREATE INDEX "assets_uploadedBy_idx" ON "assets"("uploadedBy");

-- CreateIndex
CREATE INDEX "assets_submissionId_idx" ON "assets"("submissionId");

-- CreateIndex
CREATE INDEX "vector_embeddings_submissionId_idx" ON "vector_embeddings"("submissionId");

-- CreateIndex
CREATE INDEX "vector_embeddings_contentHash_idx" ON "vector_embeddings"("contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "vector_embeddings_submissionId_chunkIndex_key" ON "vector_embeddings"("submissionId", "chunkIndex");

-- CreateIndex
CREATE UNIQUE INDEX "vector_embeddings_submissionId_embeddingModel_contentHash_key" ON "vector_embeddings"("submissionId", "embeddingModel", "contentHash");

-- CreateIndex
CREATE INDEX "verifications_type_idx" ON "verifications"("type");

-- CreateIndex
CREATE UNIQUE INDEX "verifications_identifier_type_key" ON "verifications"("identifier", "type");

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_currentSubmissionId_fkey" FOREIGN KEY ("currentSubmissionId") REFERENCES "submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tech_reads" ADD CONSTRAINT "tech_reads_currentSubmissionId_fkey" FOREIGN KEY ("currentSubmissionId") REFERENCES "submissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tech_reads" ADD CONSTRAINT "tech_reads_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_techReadId_fkey" FOREIGN KEY ("techReadId") REFERENCES "tech_reads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_techReadId_fkey" FOREIGN KEY ("techReadId") REFERENCES "tech_reads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "comments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vector_embeddings" ADD CONSTRAINT "vector_embeddings_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- Hand-written additions below this line. Prisma's schema language cannot
-- express CHECK constraints or vector index types, so these are appended by
-- hand to the Prisma-generated diff above rather than hand-written from
-- scratch. See the doc comments on the Submission, Comment, and
-- VectorEmbedding models in schema.prisma for the full rationale.
-- ============================================================================

-- Exactly-one-of (articleId, techReadId) CHECK constraints. num_nonnulls() is
-- a built-in Postgres function - no extension needed. NULL <> NULL for the
-- per-parent unique([x, version]) constraints above, so the unused nullable
-- FK being NULL does not collide across rows of the other parent type.
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_article_xor_tech_read"
  CHECK (num_nonnulls("articleId", "techReadId") = 1);

ALTER TABLE "comments" ADD CONSTRAINT "comments_article_xor_tech_read"
  CHECK (num_nonnulls("articleId", "techReadId") = 1);

-- HNSW index for fast approximate-nearest-neighbor cosine similarity search
-- over the vector(768) embedding column. Required for the AI semantic-search
-- feature to run efficient ANN queries instead of a full sequential scan;
-- vector_cosine_ops matches the cosine-distance (<=>) operator the
-- application uses for similarity search.
CREATE INDEX "vector_embeddings_embedding_idx" ON "vector_embeddings" USING hnsw ("embedding" vector_cosine_ops);
