import { prisma } from "@/lib/prisma";
import { buildCallSummary } from "@/lib/call-summary";
import { scoreCallConfidence } from "@/lib/confidence-score";
import { getAllBranches } from "@/lib/branches";
import type {
  AiSuggestionRecord,
  AiSuggestionStatus,
  Call,
  CallEvent,
  CallOutcome,
  CallStatus,
  CallWithRelations,
  CoachingNoteRecord,
  Note,
  Speaker,
  TranscriptChunkRecord,
} from "@/lib/types";
import type {
  Call as CallRow,
  CallEvent as CallEventRow,
  Note as NoteRow,
  Clinic as ClinicRow,
  TranscriptChunk as TranscriptChunkRow,
  AiSuggestion as AiSuggestionRow,
  CoachingNote as CoachingNoteRow,
} from "@prisma/client";

function toCall(row: CallRow): Call {
  return {
    id: row.id,
    clinicId: row.clinicId,
    clinicNameSnapshot: row.clinicNameSnapshot,
    status: row.status as CallStatus,
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt ? row.endedAt.toISOString() : null,
    currentBranchId: row.currentBranchId,
    speaker: row.speaker as Speaker,
    outcome: row.outcome as CallOutcome | null,
    decisionMakerReached: row.decisionMakerReached,
    transferred: row.transferred,
    callbackScheduled: row.callbackScheduled,
    discoveryBooked: row.discoveryBooked,
    outcomeNotes: row.outcomeNotes,
    followUpDate: row.followUpDate ? row.followUpDate.toISOString() : null,
    followUpTimezone: row.followUpTimezone,
    followUpContactName: row.followUpContactName,
    followUpContactNumber: row.followUpContactNumber,
    followUpNotes: row.followUpNotes,
    summary: row.summary,
    confidenceScore: row.confidenceScore,
    confidenceBreakdown: row.confidenceBreakdown,
    recordingConsent: row.recordingConsent,
    recordingStatus: row.recordingStatus as Call["recordingStatus"],
    createdAt: row.createdAt.toISOString(),
  };
}

function toCallEvent(row: CallEventRow): CallEvent {
  return {
    id: row.id,
    callId: row.callId,
    branchId: row.branchId,
    timestamp: row.timestamp.toISOString(),
    selectedBy: row.selectedBy as "rep" | "ai",
  };
}

function toNote(row: NoteRow): Note {
  return { id: row.id, callId: row.callId, text: row.text, timestamp: row.timestamp.toISOString() };
}

function toTranscriptChunk(row: TranscriptChunkRow): TranscriptChunkRecord {
  return {
    id: row.id,
    callId: row.callId,
    speaker: row.speaker as Speaker,
    text: row.text,
    source: row.source as TranscriptChunkRecord["source"],
    timestamp: row.timestamp.toISOString(),
  };
}

function toAiSuggestion(row: AiSuggestionRow): AiSuggestionRecord {
  return {
    id: row.id,
    callId: row.callId,
    transcriptChunkId: row.transcriptChunkId,
    suggestedBranchId: row.suggestedBranchId,
    confidence: row.confidence,
    status: row.status as AiSuggestionStatus,
    selectedAlternativeBranchId: row.selectedAlternativeBranchId,
    createdAt: row.createdAt.toISOString(),
    respondedAt: row.respondedAt ? row.respondedAt.toISOString() : null,
  };
}

function toCoachingNote(row: CoachingNoteRow): CoachingNoteRecord {
  return {
    id: row.id,
    callId: row.callId,
    situation: row.situation,
    recommendedQuestion: row.recommendedQuestion,
    trigger: row.trigger as CoachingNoteRecord["trigger"],
    createdAt: row.createdAt.toISOString(),
  };
}

function rowClinicToClinic(row: ClinicRow) {
  return {
    id: row.id,
    name: row.name,
    website: row.website,
    phone: row.phone,
    location: row.location,
    hasCustomAsset: row.hasCustomAsset,
    practiceNotes: row.practiceNotes,
    isDemo: row.isDemo,
    createdAt: row.createdAt.toISOString(),
  };
}

const RELATIONS_INCLUDE = {
  events: { orderBy: { timestamp: "asc" as const } },
  notes: { orderBy: { timestamp: "asc" as const } },
  transcript: { orderBy: { timestamp: "asc" as const } },
  aiSuggestions: { orderBy: { createdAt: "asc" as const } },
  coachingNotes: { orderBy: { createdAt: "asc" as const } },
  clinic: true,
};

type CallRowWithRelations = CallRow & {
  events: CallEventRow[];
  notes: NoteRow[];
  transcript: TranscriptChunkRow[];
  aiSuggestions: AiSuggestionRow[];
  coachingNotes: CoachingNoteRow[];
  clinic: ClinicRow;
};

function toCallWithRelations(row: CallRowWithRelations): CallWithRelations {
  return {
    ...toCall(row),
    events: row.events.map(toCallEvent),
    notes: row.notes.map(toNote),
    transcript: row.transcript.map(toTranscriptChunk),
    aiSuggestions: row.aiSuggestions.map(toAiSuggestion),
    coachingNotes: row.coachingNotes.map(toCoachingNote),
    clinic: rowClinicToClinic(row.clinic),
  };
}

export async function createCall(clinicId: string, rootBranchId: string): Promise<Call> {
  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
  if (!clinic) throw new Error("Clinic not found");

  const row = await prisma.call.create({
    data: {
      clinicId,
      clinicNameSnapshot: clinic.name,
      currentBranchId: rootBranchId,
      speaker: "system",
    },
  });

  await prisma.callEvent.create({
    data: { callId: row.id, branchId: rootBranchId, selectedBy: "rep" },
  });

  return toCall(row);
}

export async function getCall(id: string): Promise<CallWithRelations | null> {
  const row = await prisma.call.findUnique({ where: { id }, include: RELATIONS_INCLUDE });
  if (!row) return null;
  return toCallWithRelations(row);
}

export async function listCalls(): Promise<CallWithRelations[]> {
  const rows = await prisma.call.findMany({ orderBy: { startedAt: "desc" }, include: RELATIONS_INCLUDE });
  return rows.map(toCallWithRelations);
}

export async function selectBranch(
  callId: string,
  branchId: string,
  speaker: Speaker,
  selectedBy: "rep" | "ai" = "rep",
): Promise<void> {
  await prisma.$transaction([
    prisma.call.update({ where: { id: callId }, data: { currentBranchId: branchId, speaker } }),
    prisma.callEvent.create({ data: { callId, branchId, selectedBy } }),
  ]);
}

export async function setCallStatus(callId: string, status: CallStatus): Promise<void> {
  await prisma.call.update({ where: { id: callId }, data: { status } });
}

export async function addNote(callId: string, text: string): Promise<Note> {
  const row = await prisma.note.create({ data: { callId, text } });
  return toNote(row);
}

// --- Transcript -------------------------------------------------------

export async function addTranscriptChunk(
  callId: string,
  speaker: Speaker,
  text: string,
  source: TranscriptChunkRecord["source"] = "manual",
): Promise<TranscriptChunkRecord> {
  const row = await prisma.transcriptChunk.create({ data: { callId, speaker, text, source } });
  return toTranscriptChunk(row);
}

// --- AI suggestions -----------------------------------------------------
// Logging a suggestion NEVER touches Call.currentBranchId — only
// selectBranch() (called from a rep's explicit accept click) does that.
// See lib/branch-suggestion.ts and the "AI cannot hijack the branch" tests.

export async function logAiSuggestion(
  callId: string,
  transcriptChunkId: string | null,
  suggestedBranchId: string | null,
  confidence: number,
): Promise<AiSuggestionRecord> {
  const row = await prisma.aiSuggestion.create({
    data: { callId, transcriptChunkId, suggestedBranchId, confidence },
  });
  return toAiSuggestion(row);
}

export async function respondToAiSuggestion(
  id: string,
  status: Exclude<AiSuggestionStatus, "pending">,
  selectedAlternativeBranchId?: string | null,
): Promise<AiSuggestionRecord> {
  const row = await prisma.aiSuggestion.update({
    where: { id },
    data: { status, respondedAt: new Date(), selectedAlternativeBranchId: selectedAlternativeBranchId ?? null },
  });
  return toAiSuggestion(row);
}

// --- Coaching -------------------------------------------------------------

export async function addCoachingNote(
  callId: string,
  situation: string,
  recommendedQuestion: string,
  trigger: CoachingNoteRecord["trigger"] = "manual",
): Promise<CoachingNoteRecord> {
  const row = await prisma.coachingNote.create({ data: { callId, situation, recommendedQuestion, trigger } });
  return toCoachingNote(row);
}

// --- End of call ------------------------------------------------------

export interface EndCallInput {
  outcome: CallOutcome;
  outcomeNotes?: string | null;
  decisionMakerReached?: boolean;
  transferred?: boolean;
  callbackScheduled?: boolean;
  discoveryBooked?: boolean;
  followUpDate?: string | null;
  followUpTimezone?: string | null;
  followUpContactName?: string | null;
  followUpContactNumber?: string | null;
  followUpNotes?: string | null;
}

export async function endCall(callId: string, input: EndCallInput): Promise<Call> {
  await prisma.call.update({
    where: { id: callId },
    data: {
      status: "ENDED",
      endedAt: new Date(),
      outcome: input.outcome,
      outcomeNotes: input.outcomeNotes ?? null,
      decisionMakerReached: input.decisionMakerReached ?? false,
      transferred: input.transferred ?? false,
      callbackScheduled: input.callbackScheduled ?? false,
      discoveryBooked: input.discoveryBooked ?? false,
      followUpDate: input.followUpDate ? new Date(input.followUpDate) : null,
      followUpTimezone: input.followUpTimezone ?? null,
      followUpContactName: input.followUpContactName ?? null,
      followUpContactNumber: input.followUpContactNumber ?? null,
      followUpNotes: input.followUpNotes ?? null,
    },
  });

  // The summary and confidence score both need the full call-with-relations
  // shape, so build them in a second pass rather than threading every
  // relation through this update.
  const full = await getCall(callId);
  if (!full) throw new Error("Call not found after ending");
  const summary = await buildCallSummary(full);
  const branches = await getAllBranches();
  const confidence = scoreCallConfidence(full, branches);
  const row = await prisma.call.update({
    where: { id: callId },
    data: { summary, confidenceScore: confidence.total, confidenceBreakdown: JSON.stringify(confidence) },
  });
  return toCall(row);
}
