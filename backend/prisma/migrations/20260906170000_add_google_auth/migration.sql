-- Safe forward migration for the existing Neon database. It never drops data.
-- IF NOT EXISTS allows this migration to be reconciled if these columns/indexes
-- were applied manually before migration history was recorded.
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId");
