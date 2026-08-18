-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "speaker" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "responseText" TEXT NOT NULL,
    "responseAlt" TEXT,
    "objective" TEXT NOT NULL,
    "notes" TEXT,
    "warning" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "nextBranchIds" TEXT NOT NULL DEFAULT '[]',
    "previousBranchId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isRoot" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "phone" TEXT,
    "location" TEXT,
    "hasCustomAsset" BOOLEAN NOT NULL DEFAULT false,
    "practiceNotes" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Call" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "clinicNameSnapshot" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "currentBranchId" TEXT,
    "speaker" TEXT NOT NULL DEFAULT 'receptionist',
    "outcome" TEXT,
    "decisionMakerReached" BOOLEAN NOT NULL DEFAULT false,
    "transferred" BOOLEAN NOT NULL DEFAULT false,
    "callbackScheduled" BOOLEAN NOT NULL DEFAULT false,
    "discoveryBooked" BOOLEAN NOT NULL DEFAULT false,
    "outcomeNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallEvent" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "selectedBy" TEXT NOT NULL DEFAULT 'rep',

    CONSTRAINT "CallEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "callId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Branch_stage_idx" ON "Branch"("stage");

-- CreateIndex
CREATE INDEX "Branch_previousBranchId_idx" ON "Branch"("previousBranchId");

-- CreateIndex
CREATE INDEX "Call_clinicId_idx" ON "Call"("clinicId");

-- CreateIndex
CREATE INDEX "Call_status_idx" ON "Call"("status");

-- CreateIndex
CREATE INDEX "CallEvent_callId_idx" ON "CallEvent"("callId");

-- CreateIndex
CREATE INDEX "Note_callId_idx" ON "Note"("callId");

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallEvent" ADD CONSTRAINT "CallEvent_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;
