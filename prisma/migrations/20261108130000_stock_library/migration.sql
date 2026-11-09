-- CreateTable
CREATE TABLE "MediaFolder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaFolder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MediaFolder_createdAt_idx" ON "MediaFolder"("createdAt");

-- CreateTable
CREATE TABLE "StockMedia" (
    "id" TEXT NOT NULL,
    "folderId" TEXT,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER,
    "duration" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockMedia_url_key" ON "StockMedia"("url");

-- CreateIndex
CREATE INDEX "StockMedia_folderId_idx" ON "StockMedia"("folderId");

-- CreateIndex
CREATE INDEX "StockMedia_createdAt_idx" ON "StockMedia"("createdAt");

-- AddForeignKey
ALTER TABLE "StockMedia" ADD CONSTRAINT "StockMedia_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "MediaFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
