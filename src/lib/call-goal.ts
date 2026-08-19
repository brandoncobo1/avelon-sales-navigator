import type { Branch, Speaker } from "@/lib/types";

const CLOSING_CATEGORIES = new Set(["pitch", "discovery-call"]);

// One-line call objective shown at the top of the Navigator. Pure/derived —
// no AI, no network call — so it's always instant and never blocks the UI.
export function callGoal(speaker: Speaker, currentBranch: Branch | null): string {
  if (speaker === "system") return "Determine who answered.";
  if (speaker === "receptionist") return "Reach the decision-maker.";
  if (speaker === "decision_maker") {
    if (currentBranch && (CLOSING_CATEGORIES.has(currentBranch.category) || currentBranch.type === "SUCCESS")) {
      return "Secure discovery meeting.";
    }
    return "Identify pain and qualify the opportunity.";
  }
  return "Navigate the call.";
}
