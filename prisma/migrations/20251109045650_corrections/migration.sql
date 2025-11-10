-- CreateTable
CREATE TABLE "Corrections" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "reportId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "memberId" TEXT NOT NULL,

    CONSTRAINT "Corrections_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Corrections" ADD CONSTRAINT "Corrections_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Corrections" ADD CONSTRAINT "Corrections_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;
