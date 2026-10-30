-- CreateTable
CREATE TABLE "GoalChat" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "transcript" JSONB NOT NULL DEFAULT '[]',
    "goalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalChat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GoalChat_updatedAt_idx" ON "GoalChat"("updatedAt");
