// Domain types for the conversation engine. These are the shapes the UI and
// API routes work with — decoupled from the Prisma row shape (which stores
// tags/nextBranchIds as JSON strings because SQLite has no scalar-list type).

export type Speaker = "receptionist" | "decision_maker" | "rep" | "system";

export type BranchType =
  | "SCRIPT"
  | "QUESTION"
  | "OBJECTION"
  | "DISCOVERY"
  | "TRANSFER"
  | "CALLBACK"
  | "EXIT"
  | "SUCCESS"
  | "NOTE"
  | "DECISION_MAKER";

export const BRANCH_TYPES: BranchType[] = [
  "SCRIPT",
  "QUESTION",
  "OBJECTION",
  "DISCOVERY",
  "TRANSFER",
  "CALLBACK",
  "EXIT",
  "SUCCESS",
  "NOTE",
  "DECISION_MAKER",
];

export interface Branch {
  id: string;
  title: string;
  speaker: Speaker;
  type: BranchType;
  stage: string;
  trigger: string;
  responseText: string;
  responseAlt: string | null;
  objective: string;
  notes: string | null;
  warning: string | null;
  tags: string[];
  nextBranchIds: string[];
  previousBranchId: string | null;
  order: number;
  isRoot: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BranchInput = Omit<Branch, "id" | "createdAt" | "updatedAt">;

export type CallStatus = "LIVE" | "PAUSED" | "ENDED";

export type CallOutcome =
  | "discovery_booked"
  | "decision_maker_reached"
  | "callback"
  | "sent_info"
  | "not_interested"
  | "wrong_number"
  | "no_decision_maker"
  | "other";

export const CALL_OUTCOMES: { value: CallOutcome; label: string }[] = [
  { value: "discovery_booked", label: "Discovery booked" },
  { value: "decision_maker_reached", label: "Decision-maker reached" },
  { value: "callback", label: "Callback" },
  { value: "sent_info", label: "Sent information" },
  { value: "not_interested", label: "Not interested" },
  { value: "wrong_number", label: "Wrong number" },
  { value: "no_decision_maker", label: "No decision-maker" },
  { value: "other", label: "Other" },
];

export interface Clinic {
  id: string;
  name: string;
  website: string | null;
  phone: string | null;
  location: string | null;
  hasCustomAsset: boolean;
  practiceNotes: string | null;
  isDemo: boolean;
  createdAt: string;
}

export interface CallEvent {
  id: string;
  callId: string;
  branchId: string;
  timestamp: string;
  selectedBy: "rep" | "ai";
}

export interface Note {
  id: string;
  callId: string;
  text: string;
  timestamp: string;
}

export interface Call {
  id: string;
  clinicId: string;
  clinicNameSnapshot: string;
  status: CallStatus;
  startedAt: string;
  endedAt: string | null;
  currentBranchId: string | null;
  speaker: Speaker;
  outcome: CallOutcome | null;
  decisionMakerReached: boolean;
  transferred: boolean;
  callbackScheduled: boolean;
  discoveryBooked: boolean;
  outcomeNotes: string | null;
  createdAt: string;
}

export interface CallWithRelations extends Call {
  events: CallEvent[];
  notes: Note[];
  clinic: Clinic;
}

// ---------------------------------------------------------------------------
// Future AI integration surface (mocked in V1 — see lib/branch-suggestion.ts)
// ---------------------------------------------------------------------------

export interface TranscriptChunk {
  speaker: Speaker;
  text: string;
  timestamp: number;
}

export interface BranchSuggestion {
  transcript: string;
  suggestedBranchId: string | null;
  confidence: number;
}
