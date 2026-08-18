import { prisma } from "@/lib/prisma";
import type {
  Call,
  CallEvent,
  CallOutcome,
  CallStatus,
  CallWithRelations,
  Note,
  Speaker,
} from "@/lib/types";
import type {
  Call as CallRow,
  CallEvent as CallEventRow,
  Note as NoteRow,
  Clinic as ClinicRow,
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
  return {
    id: row.id,
    callId: row.callId,
    text: row.text,
    timestamp: row.timestamp.toISOString(),
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
  const row = await prisma.call.findUnique({
    where: { id },
    include: { events: { orderBy: { timestamp: "asc" } }, notes: { orderBy: { timestamp: "asc" } }, clinic: true },
  });
  if (!row) return null;
  return {
    ...toCall(row),
    events: row.events.map(toCallEvent),
    notes: row.notes.map(toNote),
    clinic: {
      id: row.clinic.id,
      name: row.clinic.name,
      website: row.clinic.website,
      phone: row.clinic.phone,
      location: row.clinic.location,
      hasCustomAsset: row.clinic.hasCustomAsset,
      practiceNotes: row.clinic.practiceNotes,
      isDemo: row.clinic.isDemo,
      createdAt: row.clinic.createdAt.toISOString(),
    },
  };
}

export async function listCalls(): Promise<CallWithRelations[]> {
  const rows = await prisma.call.findMany({
    orderBy: { startedAt: "desc" },
    include: { events: { orderBy: { timestamp: "asc" } }, notes: true, clinic: true },
  });
  return rows.map((row) => ({
    ...toCall(row),
    events: row.events.map(toCallEvent),
    notes: row.notes.map(toNote),
    clinic: rowClinicToClinic(row.clinic),
  }));
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

export interface EndCallInput {
  outcome: CallOutcome;
  outcomeNotes?: string | null;
  decisionMakerReached?: boolean;
  transferred?: boolean;
  callbackScheduled?: boolean;
  discoveryBooked?: boolean;
}

export async function endCall(callId: string, input: EndCallInput): Promise<Call> {
  const row = await prisma.call.update({
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
    },
  });
  return toCall(row);
}
