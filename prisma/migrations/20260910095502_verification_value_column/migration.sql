/*
  Warnings:

  - You are about to drop the column `tokenHash` on the `verifications` table. All the data in the column will be lost.
  - Added the required column `value` to the `verifications` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "vector_embeddings_embedding_idx";

-- AlterTable
ALTER TABLE "verifications" DROP COLUMN "tokenHash",
ADD COLUMN     "value" TEXT NOT NULL;

-- Prisma's schema-diff engine cannot express an HNSW index (see the baseline migration), so every
-- `prisma migrate dev` re-diff treats it as absent and drops it above. Recreate it here so a fresh
-- database (or `migrate deploy`) ends up with the index restored, matching the baseline migration.
CREATE INDEX "vector_embeddings_embedding_idx" ON "vector_embeddings" USING hnsw ("embedding" vector_cosine_ops);
