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
  // visitedBranches includes currentBranch as its last entry (the caller
  // builds the trail through the active branch), so "earlier in the call"
  // means everything before that final entry.
  const priorBranches = visitedBranches.slice(0, -1);

  if (currentBranch?.type === "DECISION_MAKER" && !painEstablished) {
    return {
      situation: "You've identified their setup but haven't established pain yet.",
      recommendedQuestion: "What's the one thing you'd change about it if you could?",
      doNotPitchYet: true,
    };
  }

  // Over-aggression nudge — the same objection (by classification, when
  // set, else by objection type) has already come up once this call. Coming
  // back to it a second time usually means it wasn't actually addressed the
  // first time, not that repeating the same push will land better.
  if (currentBranch?.type === "OBJECTION") {
    const key = currentBranch.classification ?? currentBranch.objectionType;
    const repeated = key && priorBranches.some((b) => b.type === "OBJECTION" && (b.classification ?? b.objectionType) === key);
    if (repeated) {
      return {
        situation: "This same objection came up earlier in the call too.",
        recommendedQuestion: "Slow down and actually address what's behind it this time, rather than pushing past it again.",
        doNotPitchYet: false,
      };
    }
  }

  if (lastVisited?.type === "OBJECTION" && currentBranch?.id === lastVisited.id) {
    return {
      situation: "They just raised an objection.",
      recommendedQuestion: "Acknowledge it, then ask a clarifying question before you respond — don't argue.",
      doNotPitchYet: false,
    };
  }

  // Retreating nudge — wrapping up right after a genuine (non-brush-off)
  // objection when the script actually offered a way to keep the
  // conversation going. Worth a beat to check this is a real "no", not an
  // early fold.
  if (currentBranch && (currentBranch.type === "EXIT" || currentBranch.type === "CALLBACK")) {
    const previous = priorBranches[priorBranches.length - 1];
    if (previous?.type === "OBJECTION" && previous.classification !== "receptionist_brush_off" && previous.nextBranchIds.length > 1) {
      return {
        situation: "Wrapping up right after a real objection.",
        recommendedQuestion: "Double check this is a genuine no, not an early retreat — the script had another way to keep going here.",
        doNotPitchYet: false,
      };
    }
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
