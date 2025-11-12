/*
  Warnings:

  - You are about to drop the column `tag` on the `Message` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Message" DROP COLUMN "tag",
ADD COLUMN     "tags" TEXT[];
