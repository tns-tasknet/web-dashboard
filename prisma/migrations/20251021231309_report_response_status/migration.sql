-- CreateEnum
CREATE TYPE "ReportProgress" AS ENUM ('PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "response" TEXT,
ADD COLUMN     "status" "ReportProgress" NOT NULL DEFAULT 'PENDING';
