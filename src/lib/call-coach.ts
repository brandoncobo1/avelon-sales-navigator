import type { Branch } from "@/lib/types";

export interface CoachResult {
  situation: string;
  recommendedQuestion: string;
  doNotPitchYet: boolean;
}

// Rule-based "Coach Me" + "DO NOT PITCH YET" logic — V1 heuristic, no LLM.
// Runs entirely on tags/type/category already on the branch graph, so it
// works with zero external services. A real version (Phase 5) would read
// the actual transcript instead of just the branch path; the output shape
// (one situation line + one question) stays the same either way.
export function heuristicCoach(currentBranch: Branch | null, visitedBranches: Branch[]): CoachResult {
  const painEstablished = visitedBranches.some((b) => b.tags.includes("pain-discovery"));
  const lastVisited = visitedBranches[visitedBranches.length - 1];

  if (currentBranch?.type === "DECISION_MAKER" && !painEstablished) {
    return {
      situation: "You've identified their setup but haven't established pain yet.",
      recommendedQuestion: "What's the one thing you'd change about it if you could?",
      doNotPitchYet: true,
    };
  }

  if (lastVisited?.type === "OBJECTION" && currentBranch?.id === lastVisited.id) {
    return {
      situation: "They just raised an objection.",
      recommendedQuestion: "Acknowledge it, then ask a clarifying question before you respond — don't argue.",
      doNotPitchYet: false,
    };
  }

  if (currentBranch?.type === "SUCCESS") {
    return {
      situation: "Objective achieved on this branch.",
      recommendedQuestion: "Confirm the next step out loud before you hang up.",
      doNotPitchYet: false,
    };
  }

  if (currentBranch) {
    return {
      situation: currentBranch.objective,
      recommendedQuestion: currentBranch.responseText,
      doNotPitchYet: false,
    };
  }

  return {
    situation: "No active branch.",
    recommendedQuestion: "Pick a branch to get started.",
    doNotPitchYet: false,
  };
}
