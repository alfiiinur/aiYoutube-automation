-- CreateEnum
CREATE TYPE "GoalMetric" AS ENUM ('videos_ready', 'posts_sent');

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "metric" "GoalMetric" NOT NULL DEFAULT 'videos_ready',
    "target" INTEGER NOT NULL DEFAULT 10,
    "deadline" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Goal_createdAt_idx" ON "Goal"("createdAt");
