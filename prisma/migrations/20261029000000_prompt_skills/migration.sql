-- CreateTable
CREATE TABLE "PromptSkill" (
    "id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "series" TEXT,
    "part" INTEGER,
    "aspectRatio" TEXT NOT NULL DEFAULT '9:16',
    "durationSec" INTEGER NOT NULL DEFAULT 45,
    "style" TEXT NOT NULL DEFAULT 'cinematic',
    "voice" TEXT NOT NULL DEFAULT 'female-id',
    "model" TEXT NOT NULL DEFAULT 'studio-v1',
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptSkill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromptSkill_series_idx" ON "PromptSkill"("series");

-- CreateIndex
CREATE INDEX "PromptSkill_createdAt_idx" ON "PromptSkill"("createdAt");
