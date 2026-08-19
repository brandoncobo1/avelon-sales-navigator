import type { Branch, CallWithRelations } from "@/lib/types";

// Rule-based post-call confidence/assertiveness score — V1 heuristic, no
// LLM. Built entirely from the branch path already on the call (which
// branches were visited, in what order, what the call ended in), the same
// structured data lib/call-coach.ts and lib/call-summary.ts already use.
// It cannot read tone of voice or actual phrasing — that needs a real
// transcript + LLM (Phase 5) — so it scores CHOICES (did you keep going
// after an objection, did you stop pushing after a genuine "no") rather
// than delivery. See README "Confidence scoring".

export interface ConfidenceComponent {
  key: string;
  label: string;
  score: number;
  max: number;
  detail: string;
}

export interface ConfidenceBreakdown {
  total: number;
  band: string;
  bandDetail: string;
  components: ConfidenceComponent[];
}

const REJECTION_OUTCOMES = new Set(["not_interested", "no_fit", "wrong_number"]);

function scoreObjectionResilience(objectionEvents: { branch: Branch; hasFollowUp: boolean }[]): ConfidenceComponent {
  const max = 40;
  if (objectionEvents.length === 0) {
    return {
      key: "objection_resilience",
      label: "Objection resilience",
      score: 30,
      max,
      detail: "No objections came up on this call, so there's nothing to score here.",
    };
  }
  const pushedThrough = objectionEvents.filter((e) => e.hasFollowUp).length;
  const ratio = pushedThrough / objectionEvents.length;
  return {
    key: "objection_resilience",
    label: "Objection resilience",
    score: Math.round(ratio * max),
    max,
    detail: `Kept the conversation moving after ${pushedThrough} of ${objectionEvents.length} objection(s) instead of folding.`,
  };
}

function scoreMomentum(call: CallWithRelations): ConfidenceComponent {
  const max = 30;
  let score = 5;
  const notes: string[] = [];
  if (call.decisionMakerReached) {
    score += 10;
    notes.push("reached the decision-maker");
  }
  if (call.transferred) {
    score += 5;
    notes.push("got transferred");
  }
  if (call.discoveryBooked) {
    score += 15;
    notes.push("booked a discovery call");
  } else if (call.callbackScheduled) {
    score += 8;
    notes.push("locked in a callback");
  }
  score = Math.min(score, max);
  return {
    key: "momentum",
    label: "Forward momentum",
    score,
    max,
    detail: notes.length > 0 ? `Call progressed: ${notes.join(", ")}.` : "Call didn't progress past the opening stages.",
  };
}

function scorePersistence(eventCount: number): ConfidenceComponent {
  const max = 15;
  let score: number;
  if (eventCount >= 10) score = 15;
  else if (eventCount >= 5) score = 12;
  else if (eventCount >= 2) score = 7;
  else score = 3;
  return {
    key: "persistence",
    label: "Call depth",
    score,
    max,
    detail: `${eventCount} branch step(s) worked through during the call.`,
  };
}

function scoreRespectsRejection(call: CallWithRelations, eventsAfterLastRealObjection: number): ConfidenceComponent {
  const max = 15;
  const isRejection = call.outcome ? REJECTION_OUTCOMES.has(call.outcome) : false;
  if (!isRejection) {
    return {
      key: "respects_rejection",
      label: "Respecting a genuine no",
      score: max,
      max,
      detail: "No hard rejection on this call — nothing to check here.",
    };
  }
  // A genuine hard "no" was hit. Full marks for stopping promptly after it;
  // docked for continuing to push several more steps past a clear rejection.
  const score = eventsAfterLastRealObjection <= 1 ? max : eventsAfterLastRealObjection <= 3 ? 9 : 4;
  return {
    key: "respects_rejection",
    label: "Respecting a genuine no",
    score,
    max,
    detail:
      eventsAfterLastRealObjection <= 1
        ? "Call ended promptly after a genuine rejection — respected it instead of pushing."
        : `Kept going ${eventsAfterLastRealObjection} more step(s) after a genuine rejection — worth checking whether that was pushing too hard.`,
  };
}

function bandFor(total: number): { band: string; bandDetail: string } {
  if (total >= 80) return { band: "Confident and assertive", bandDetail: "Held the line through objections and kept the call moving." };
  if (total >= 60) return { band: "Solid, room to sharpen", bandDetail: "Good overall shape — look at the lowest-scoring section below." };
  if (total >= 40) return { band: "Hesitant in places", bandDetail: "Objections or momentum stalled the call more than once." };
  return { band: "Needs more push-through", bandDetail: "The call folded early or stalled — review the objection handling." };
}

export function scoreCallConfidence(call: CallWithRelations, branches: Branch[]): ConfidenceBreakdown {
  const branchMap = new Map(branches.map((b) => [b.id, b]));
  const orderedEvents = call.events; // already ordered by timestamp asc

  const objectionEvents: { branch: Branch; hasFollowUp: boolean }[] = [];
  let lastRealObjectionIndex = -1;

  orderedEvents.forEach((event, i) => {
    const branch = branchMap.get(event.branchId);
    if (!branch || branch.type !== "OBJECTION") return;
    objectionEvents.push({ branch, hasFollowUp: i < orderedEvents.length - 1 });
    if (branch.classification !== "receptionist_brush_off") lastRealObjectionIndex = i;
  });

  const eventsAfterLastRealObjection = lastRealObjectionIndex >= 0 ? orderedEvents.length - 1 - lastRealObjectionIndex : 0;

  const components = [
    scoreObjectionResilience(objectionEvents),
    scoreMomentum(call),
    scorePersistence(orderedEvents.length),
    scoreRespectsRejection(call, eventsAfterLastRealObjection),
  ];

  const total = components.reduce((sum, c) => sum + c.score, 0);
  const { band, bandDetail } = bandFor(total);

  return { total, band, bandDetail, components };
}
