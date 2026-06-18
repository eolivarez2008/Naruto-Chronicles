-- CreateTable
CREATE TABLE "Saga" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jikanId" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "synopsisFr" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "score" REAL,
    "creator" TEXT NOT NULL,
    "total" INTEGER,
    "year" INTEGER,
    "lastUpdated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Saga_jikanId_key" ON "Saga"("jikanId");

-- CreateIndex
CREATE UNIQUE INDEX "Saga_key_key" ON "Saga"("key");
