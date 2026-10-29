-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('queued', 'analyzing', 'scripting', 'rendering', 'ready', 'failed');

-- CreateEnum
CREATE TYPE "ReferencePlatform" AS ENUM ('youtube', 'instagram', 'tiktok', 'web');

-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('threads', 'instagram', 'facebook');

-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('scheduled', 'sent', 'failed');

-- CreateEnum
CREATE TYPE "AutomationPlatform" AS ENUM ('youtube', 'tiktok', 'instagram');

-- CreateEnum
CREATE TYPE "AutomationPrivacy" AS ENUM ('public', 'unlisted', 'private');

-- CreateTable
CREATE TABLE "VideoJob" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "prompt" TEXT NOT NULL,
    "referenceIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "aspectRatio" TEXT NOT NULL DEFAULT '9:16',
    "durationSec" INTEGER NOT NULL DEFAULT 45,
    "style" TEXT NOT NULL DEFAULT 'cinematic',
    "voice" TEXT NOT NULL DEFAULT 'female-id',
    "model" TEXT NOT NULL DEFAULT 'studio-v1',
    "status" "JobStatus" NOT NULL DEFAULT 'queued',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hook" TEXT NOT NULL DEFAULT '',
    "script" TEXT NOT NULL DEFAULT '',
    "caption" TEXT NOT NULL DEFAULT '',
    "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scenes" JSONB NOT NULL DEFAULT '[]',
    "thumbnailIdea" TEXT NOT NULL DEFAULT '',
    "musicMood" TEXT NOT NULL DEFAULT '',
    "logs" JSONB NOT NULL DEFAULT '[]',
    "error" TEXT,
    "editor" JSONB,

    CONSTRAINT "VideoJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenceSource" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "platform" "ReferencePlatform" NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "thumbnail" TEXT,
    "description" TEXT,
    "durationHint" TEXT,
    "insights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferenceSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Automation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "cron" TEXT NOT NULL,
    "humanSchedule" TEXT NOT NULL,
    "promptTemplate" TEXT NOT NULL,
    "platform" "AutomationPlatform" NOT NULL DEFAULT 'youtube',
    "privacy" "AutomationPrivacy" NOT NULL DEFAULT 'public',
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "runs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Automation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "accountName" TEXT NOT NULL,
    "accessToken" TEXT,
    "userId" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPost" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "caption" TEXT NOT NULL DEFAULT '',
    "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mediaUrl" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "PublishStatus" NOT NULL DEFAULT 'scheduled',
    "publishedAt" TIMESTAMP(3),
    "postUrl" TEXT,
    "simulated" BOOLEAN NOT NULL DEFAULT true,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoJob_createdAt_idx" ON "VideoJob"("createdAt");

-- CreateIndex
CREATE INDEX "VideoJob_status_idx" ON "VideoJob"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ReferenceSource_url_key" ON "ReferenceSource"("url");

-- CreateIndex
CREATE INDEX "ReferenceSource_createdAt_idx" ON "ReferenceSource"("createdAt");

-- CreateIndex
CREATE INDEX "ReferenceSource_platform_idx" ON "ReferenceSource"("platform");

-- CreateIndex
CREATE INDEX "Automation_createdAt_idx" ON "Automation"("createdAt");

-- CreateIndex
CREATE INDEX "Automation_enabled_idx" ON "Automation"("enabled");

-- CreateIndex
CREATE INDEX "SocialAccount_platform_idx" ON "SocialAccount"("platform");

-- CreateIndex
CREATE INDEX "SocialPost_scheduledAt_idx" ON "SocialPost"("scheduledAt");

-- CreateIndex
CREATE INDEX "SocialPost_status_idx" ON "SocialPost"("status");

-- CreateIndex
CREATE INDEX "SocialPost_platform_idx" ON "SocialPost"("platform");

-- AddForeignKey
ALTER TABLE "SocialPost" ADD CONSTRAINT "SocialPost_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "VideoJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
