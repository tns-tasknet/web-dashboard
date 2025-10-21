/*
  Warnings:

  - You are about to drop the column `reportId` on the `member` table. All the data in the column will be lost.
  - Added the required column `memberId` to the `Report` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."member" DROP CONSTRAINT "member_reportId_fkey";

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "memberId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "member" DROP COLUMN "reportId";

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
