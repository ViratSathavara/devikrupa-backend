-- CreateTable
CREATE TABLE "PageConstructionSetting" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isUnderConstruction" BOOLEAN NOT NULL DEFAULT false,
    "message" TEXT,
    "updatedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageConstructionSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PageConstructionSetting_path_key" ON "PageConstructionSetting"("path");
