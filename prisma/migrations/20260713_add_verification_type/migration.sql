-- Add type column to Verification table
ALTER TABLE "verifications" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'email_verification';

-- Create unique index on identifier + type
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_identifier_type_key" UNIQUE("identifier", "type");

-- Create index on type for filtering
CREATE INDEX "verifications_type_idx" ON "verifications"("type");
