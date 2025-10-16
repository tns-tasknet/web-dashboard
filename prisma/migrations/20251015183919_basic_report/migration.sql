/*
  Warnings:

  - You are about to drop the `Test` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "member" ADD COLUMN     "reportId" INTEGER;

-- DropTable
DROP TABLE "public"."Test";

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "member" ADD CONSTRAINT "member_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;
