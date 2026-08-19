import type { Speaker } from "@/lib/types";

export interface QuickObjection {
  branchId: string;
  label: string;
}

// Always-available objections, independent of the current branch — a real
// prospect can say any of these at any moment, not just right after the
// opening line. Surfaced via a persistent bar in the Navigator rather than
// appended to every branch's nextBranchIds (see seed-branches.ts "UNIVERSAL
// OBJECTIONS" section for why).
export function quickObjectionsFor(speaker: Speaker): QuickObjection[] {
  if (speaker === "receptionist") {
    return [
      { branchId: "univ-r-not-interested", label: "Not interested" },
      { branchId: "univ-r-no-time", label: "No time" },
      { branchId: "univ-r-are-you-selling", label: "Are you selling?" },
      { branchId: "univ-r-why-asking", label: "Why are you asking?" },
    ];
  }
  if (speaker === "decision_maker") {
    return [
      { branchId: "univ-dm-not-interested", label: "Not interested" },
      { branchId: "univ-dm-no-time", label: "No time / busy" },
      { branchId: "univ-dm-are-you-selling", label: "What's this about?" },
    ];
  }
  return [];
}
