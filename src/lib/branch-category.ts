// Coarse topic grouping derived from a branch's `stage`, shared across the
// receptionist and decision-maker trees (e.g. "software" covers both
// `receptionist-software-dislike` and `decision-maker-pain`-adjacent nodes).
// Used for search, filtering, and analytics grouping. Stored on the branch
// (not computed on read) so it stays stable even if `stage` naming evolves.
export function deriveCategory(stage: string): string {
  const s = stage.toLowerCase();
  if (s === "root") return "opening";
  if (s.includes("objection")) return "objection";
  if (s.includes("transfer")) return "transfer";
  if (s.includes("discovery-call")) return "discovery-call";
  if (s.includes("pitch")) return "pitch";
  if (s.includes("reactivation")) return "reactivation";
  if (s.includes("bookings")) return "bookings";
  if (s.includes("followup")) return "followup";
  if (s.includes("volume")) return "volume";
  if (s.includes("pain")) return "pain";
  if (s.includes("manual")) return "manual-process";
  if (s.includes("software")) return "software";
  if (s.includes("discovery")) return "current-setup";
  if (s.includes("context")) return "context";
  if (s.includes("opening") || s.includes("intro")) return "opening";
  return "general";
}
