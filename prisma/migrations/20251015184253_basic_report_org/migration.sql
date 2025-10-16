/*
  Warnings:

  - Added the required column `organizationId` to the `Report` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
