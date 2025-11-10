-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "deviceId" TEXT,
ADD COLUMN     "latitude" DECIMAL(65,30),
ADD COLUMN     "longitude" DECIMAL(65,30);
