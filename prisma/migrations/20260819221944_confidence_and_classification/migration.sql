-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "classification" TEXT,
ADD COLUMN     "whyItWorks" TEXT;

-- AlterTable
ALTER TABLE "Call" ADD COLUMN     "confidenceBreakdown" TEXT,
ADD COLUMN     "confidenceScore" INTEGER;
