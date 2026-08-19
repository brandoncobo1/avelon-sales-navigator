import { prisma } from "@/lib/prisma";
import { toBranch } from "@/lib/branch-utils";

export interface BranchAnalyticsRow {
  branchId: string;
  title: string;
  category: string;
  type: string;
  timesEncountered: number;
  callsWithDiscoveryBooked: number;
  conversionRate: number; // callsWithDiscoveryBooked / distinct calls that visited this branch
}

// "Times encountered" counts every CallEvent (a branch can appear more than
// once per call if the rep backtracks). Conversion is computed over
// *distinct calls* that touched the branch, since that's the meaningful
// denominator for "did this path lead somewhere good" — not raw event count.
export async function getBranchAnalytics(): Promise<BranchAnalyticsRow[]> {
  const [branchRows, events, calls] = await Promise.all([
    prisma.branch.findMany(),
    prisma.callEvent.findMany({ select: { branchId: true, callId: true } }),
    prisma.call.findMany({ select: { id: true, outcome: true } }),
  ]);

  const outcomeByCallId = new Map(calls.map((c) => [c.id, c.outcome]));
  const branches = branchRows.map(toBranch);

  const callIdsByBranch = new Map<string, Set<string>>();
  const encounterCountByBranch = new Map<string, number>();
  for (const event of events) {
    encounterCountByBranch.set(event.branchId, (encounterCountByBranch.get(event.branchId) ?? 0) + 1);
    if (!callIdsByBranch.has(event.branchId)) callIdsByBranch.set(event.branchId, new Set());
    callIdsByBranch.get(event.branchId)!.add(event.callId);
  }

  const rows: BranchAnalyticsRow[] = branches.map((branch) => {
    const timesEncountered = encounterCountByBranch.get(branch.id) ?? 0;
    const callIds = callIdsByBranch.get(branch.id) ?? new Set<string>();
    const callsWithDiscoveryBooked = [...callIds].filter((id) => outcomeByCallId.get(id) === "discovery_booked").length;
    return {
      branchId: branch.id,
      title: branch.title,
      category: branch.category,
      type: branch.type,
      timesEncountered,
      callsWithDiscoveryBooked,
      conversionRate: callIds.size > 0 ? callsWithDiscoveryBooked / callIds.size : 0,
    };
  });

  return rows.filter((r) => r.timesEncountered > 0).sort((a, b) => b.timesEncountered - a.timesEncountered);
}
