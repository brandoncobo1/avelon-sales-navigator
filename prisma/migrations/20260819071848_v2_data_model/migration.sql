-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "abTestGroup" TEXT,
ADD COLUMN     "aiConfidenceThreshold" DOUBLE PRECISION,
ADD COLUMN     "aiKeywords" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "branchPriority" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'general',
ADD COLUMN     "objectionType" TEXT,
ADD COLUMN     "outcome" TEXT,
ADD COLUMN     "terminal" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Call" ADD COLUMN     "followUpContactName" TEXT,
ADD COLUMN     "followUpContactNumber" TEXT,
ADD COLUMN     "followUpDate" TIMESTAMP(3),
ADD COLUMN     "followUpNotes" TEXT,
ADD COLUMN     "followUpTimezone" TEXT,
ADD COLUMN     "recordingConsent" BOOLEAN,
ADD COLUMN     "recordingStatus" TEXT NOT NULL DEFAULT 'not_recording',
ADD COLUMN     "summary" TEXT;

-- CreateTable
CREATE TABLE "TranscriptChunk" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "speaker" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TranscriptChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiSuggestion" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "transcriptChunkId" TEXT,
    "suggestedBranchId" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "selectedAlternativeBranchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "AiSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachingNote" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "situation" TEXT NOT NULL,
    "recommendedQuestion" TEXT NOT NULL,
    "trigger" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachingNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TranscriptChunk_callId_idx" ON "TranscriptChunk"("callId");

-- CreateIndex
CREATE INDEX "AiSuggestion_callId_idx" ON "AiSuggestion"("callId");

-- CreateIndex
CREATE INDEX "AiSuggestion_status_idx" ON "AiSuggestion"("status");

-- CreateIndex
CREATE INDEX "CoachingNote_callId_idx" ON "CoachingNote"("callId");

-- CreateIndex
CREATE INDEX "Branch_category_idx" ON "Branch"("category");

-- AddForeignKey
ALTER TABLE "TranscriptChunk" ADD CONSTRAINT "TranscriptChunk_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSuggestion" ADD CONSTRAINT "AiSuggestion_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiSuggestion" ADD CONSTRAINT "AiSuggestion_transcriptChunkId_fkey" FOREIGN KEY ("transcriptChunkId") REFERENCES "TranscriptChunk"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachingNote" ADD CONSTRAINT "CoachingNote_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;
