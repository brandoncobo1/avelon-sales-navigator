import { getAllBranches } from "@/lib/branches";
import { CALL_OUTCOMES, type CallWithRelations } from "@/lib/types";

// Rule-based call summary — built entirely from structured data already on
// the call (branch path, categories touched, notes, outcome). It does not
// try to extract entities like a software name or a contact's name from
// free text — that needs a real LLM (Phase 5) and is intentionally left to
// Isse's own notes for now rather than faked. See README "AI architecture".
export async function buildCallSummary(call: CallWithRelations): Promise<string> {
  const branches = await getAllBranches();
  const branchMap = new Map(branches.map((b) => [b.id, b]));

  const visitedCategories = new Set<string>();
  const objectionsHandled: string[] = [];
  for (const event of call.events) {
    const branch = branchMap.get(event.branchId);
    if (!branch) continue;
    visitedCategories.add(branch.category);
    if (branch.type === "OBJECTION") objectionsHandled.push(branch.title);
  }

  const lines: string[] = [];
  lines.push(`Clinic: ${call.clinicNameSnapshot}`);
  lines.push(`Speaker reached: ${call.decisionMakerReached ? "Decision-maker" : "Receptionist only"}`);
  if (call.transferred) lines.push("Transferred to decision-maker during the call.");
  if (visitedCategories.size > 0) {
    lines.push(`Topics covered: ${[...visitedCategories].filter((c) => c !== "opening").join(", ") || "opening only"}.`);
  }
  if (objectionsHandled.length > 0) {
    lines.push(`Objections raised: ${objectionsHandled.join("; ")}.`);
  }
  const outcomeLabel = CALL_OUTCOMES.find((o) => o.value === call.outcome)?.label ?? call.outcome ?? "Not set";
  lines.push(`Outcome: ${outcomeLabel}.`);
  if (call.followUpDate) {
    lines.push(`Follow-up: ${new Date(call.followUpDate).toLocaleString("en-GB")}${call.followUpTimezone ? ` (${call.followUpTimezone})` : ""}.`);
  }
  if (call.notes.length > 0) {
    lines.push("Notes: " + call.notes.map((n) => n.text).join(" / "));
  }

  return lines.join("\n");
}
