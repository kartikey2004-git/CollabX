/*
  Warnings:

  - You are about to drop the column `indexStatus` on the `submissions` table. All the data in the column will be lost.
  - You are about to drop the column `lastIndexedAt` on the `submissions` table. All the data in the column will be lost.
  - You are about to drop the `vector_embeddings` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "vector_embeddings" DROP CONSTRAINT "vector_embeddings_submissionId_fkey";

-- AlterTable
ALTER TABLE "submissions" DROP COLUMN "indexStatus",
DROP COLUMN "lastIndexedAt";

-- DropTable
DROP TABLE "vector_embeddings";

-- DropEnum
DROP TYPE "IndexStatus";
