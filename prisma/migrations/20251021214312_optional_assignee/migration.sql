-- DropForeignKey
ALTER TABLE "public"."Report" DROP CONSTRAINT "Report_memberId_fkey";

-- AlterTable
ALTER TABLE "Report" ALTER COLUMN "memberId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
