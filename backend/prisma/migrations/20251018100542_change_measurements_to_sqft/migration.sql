/*
  Warnings:

  - You are about to drop the column `areaSqm` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `lengthMm` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `widthMm` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `areaSqm` on the `QuoteItem` table. All the data in the column will be lost.
  - You are about to drop the column `lengthMm` on the `QuoteItem` table. All the data in the column will be lost.
  - You are about to drop the column `widthMm` on the `QuoteItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "areaSqm",
DROP COLUMN "lengthMm",
DROP COLUMN "widthMm",
ADD COLUMN     "areaSqFt" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "lengthFt" DECIMAL(65,30),
ADD COLUMN     "widthFt" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "QuoteItem" DROP COLUMN "areaSqm",
DROP COLUMN "lengthMm",
DROP COLUMN "widthMm",
ADD COLUMN     "areaSqFt" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "lengthFt" DECIMAL(65,30),
ADD COLUMN     "widthFt" DECIMAL(65,30);
