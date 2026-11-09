-- AlterEnum: tambah platform sosial untuk automation (rebuild agar aman di dalam transaksi)
ALTER TABLE "Automation" ALTER COLUMN "platform" DROP DEFAULT;
CREATE TYPE "AutomationPlatform_new" AS ENUM ('youtube', 'tiktok', 'instagram', 'threads', 'facebook');
ALTER TABLE "Automation" ALTER COLUMN "platform" TYPE "AutomationPlatform_new" USING "platform"::text::"AutomationPlatform_new";
ALTER TYPE "AutomationPlatform" RENAME TO "AutomationPlatform_old";
ALTER TYPE "AutomationPlatform_new" RENAME TO "AutomationPlatform";
DROP TYPE "AutomationPlatform_old";
ALTER TABLE "Automation" ALTER COLUMN "platform" SET DEFAULT 'youtube';

-- AlterTable: postingan stock video tidak wajib terikat ke job
ALTER TABLE "SocialPost" ALTER COLUMN "jobId" DROP NOT NULL;
