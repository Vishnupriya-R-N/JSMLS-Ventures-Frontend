-- CreateTable
CREATE TABLE "StageConfiguration" (
    "id" TEXT NOT NULL,
    "stageNumber" INTEGER NOT NULL,
    "firstPersonFigure" DECIMAL(12,2) NOT NULL,
    "secondPersonFigure" DECIMAL(12,2) NOT NULL,
    "thirdPersonFigure" DECIMAL(12,2) NOT NULL,
    "level12Total" DECIMAL(12,2) NOT NULL,
    "level3Total" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StageConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StageConfiguration_stageNumber_key" ON "StageConfiguration"("stageNumber");
