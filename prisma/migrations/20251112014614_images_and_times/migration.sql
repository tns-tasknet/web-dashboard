-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "evidence" BYTEA[],
ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "signature" BYTEA;
