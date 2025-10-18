/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,invoiceNo]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,docType]` on the table `NumberSequence` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,orderNo]` on the table `Order` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,quoteNo]` on the table `Quote` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Invoice_invoiceNo_key";

-- DropIndex
DROP INDEX "public"."Order_orderNo_key";

-- DropIndex
DROP INDEX "public"."Quote_quoteNo_key";

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "address" JSONB,
ADD COLUMN     "annualRevenue" TEXT,
ADD COLUMN     "bankDetails" JSONB,
ADD COLUMN     "billingAddress" JSONB,
ADD COLUMN     "certifications" JSONB,
ADD COLUMN     "cinNumber" TEXT,
ADD COLUMN     "companyType" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currency" TEXT DEFAULT 'INR',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "documents" JSONB,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "employeeCount" TEXT,
ADD COLUMN     "foundedYear" INTEGER,
ADD COLUMN     "gstNumber" TEXT,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "maxUsers" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "panNumber" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "registrationNumber" TEXT,
ADD COLUMN     "socialMedia" JSONB,
ADD COLUMN     "specializations" JSONB,
ADD COLUMN     "timeZone" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "website" TEXT,
ADD COLUMN     "workingHours" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_organizationId_invoiceNo_key" ON "Invoice"("organizationId", "invoiceNo");

-- CreateIndex
CREATE UNIQUE INDEX "NumberSequence_organizationId_docType_key" ON "NumberSequence"("organizationId", "docType");

-- CreateIndex
CREATE UNIQUE INDEX "Order_organizationId_orderNo_key" ON "Order"("organizationId", "orderNo");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_organizationId_quoteNo_key" ON "Quote"("organizationId", "quoteNo");
