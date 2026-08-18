import { prisma } from "@/lib/prisma";
import { toBranch } from "@/lib/branch-utils";
import { CALL_OUTCOMES } from "@/lib/types";

export interface DashboardStats {
  totalCalls: number;
  callsThisWeek: number;
  decisionMakersReached: number;
  callsTransferred: number;
  followUpsGenerated: number;
  avgCallDurationSeconds: number | null;
  mostCommonReceptionistBranch: string | null;
  mostCommonObjection: string | null;
  mostCommonOutcome: string | null;
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export async function getDashboardStats(): Promise<DashboardStats> {
  const [calls, events, branchRows] = await Promise.all([
    prisma.call.findMany(),
    prisma.callEvent.findMany(),
    prisma.branch.findMany(),
  ]);

  const branchesById = new Map(branchRows.map((row) => [row.id, toBranch(row)]));

  const now = Date.now();
  const totalCalls = calls.length;
  const callsThisWeek = calls.filter((c) => now - c.startedAt.getTime() <= WEEK_MS).length;
  const decisionMakersReached = calls.filter((c) => c.decisionMakerReached).length;
  const callsTransferred = calls.filter((c) => c.transferred).length;
  const followUpsGenerated = calls.filter((c) => c.callbackScheduled || c.discoveryBooked).length;

  const endedDurations = calls
    .filter((c) => c.endedAt)
    .map((c) => (c.endedAt as Date).getTime() - c.startedAt.getTime())
    .filter((ms) => ms > 0);
  const avgCallDurationSeconds =
    endedDurations.length > 0
      ? Math.round(endedDurations.reduce((a, b) => a + b, 0) / endedDurations.length / 1000)
      : null;

  const branchCounts = new Map<string, number>();
  for (const event of events) {
    branchCounts.set(event.branchId, (branchCounts.get(event.branchId) ?? 0) + 1);
  }

  let mostCommonReceptionistBranch: string | null = null;
  let mostCommonObjection: string | null = null;
  let bestReceptionistCount = 0;
  let bestObjectionCount = 0;

  for (const [branchId, count] of branchCounts.entries()) {
    const branch = branchesById.get(branchId);
    if (!branch || branch.isRoot) continue;
    if (branch.speaker === "receptionist" && count > bestReceptionistCount) {
      bestReceptionistCount = count;
      mostCommonReceptionistBranch = branch.title;
    }
    if (branch.type === "OBJECTION" && count > bestObjectionCount) {
      bestObjectionCount = count;
      mostCommonObjection = branch.title;
    }
  }

  const outcomeCounts = new Map<string, number>();
  for (const call of calls) {
    if (!call.outcome) continue;
    outcomeCounts.set(call.outcome, (outcomeCounts.get(call.outcome) ?? 0) + 1);
  }
  let mostCommonOutcome: string | null = null;
  let bestOutcomeCount = 0;
  for (const [outcome, count] of outcomeCounts.entries()) {
    if (count > bestOutcomeCount) {
      bestOutcomeCount = count;
      mostCommonOutcome = CALL_OUTCOMES.find((o) => o.value === outcome)?.label ?? outcome;
    }
  }

  return {
    totalCalls,
    callsThisWeek,
    decisionMakersReached,
    callsTransferred,
    followUpsGenerated,
    avgCallDurationSeconds,
    mostCommonReceptionistBranch,
    mostCommonObjection,
    mostCommonOutcome,
  };
}
