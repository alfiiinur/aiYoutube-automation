-- CreateTable
CREATE TABLE "PromptHistory" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 5,
    "ideas" JSONB NOT NULL DEFAULT '[]',
    "source" TEXT NOT NULL DEFAULT 'local',
    "notice" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PromptHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromptHistory_createdAt_idx" ON "PromptHistory"("createdAt");
