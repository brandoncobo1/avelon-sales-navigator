// Domain types for the conversation engine. These are the shapes the UI and
// API routes work with — decoupled from the Prisma row shape (which stores
// tags/nextBranchIds/aiKeywords as JSON strings because Postgres columns here
// are plain text, not because of any database limitation — keeping the write
// path simple and avoiding an array-vs-string split across branch fields).

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

export type ObjectionType =
  | "not_interested"
  | "too_expensive"
  | "happy_with_current"
  | "already_have_software"
  | "already_have_someone"
  | "send_information"
  | "need_to_think"
  | "need_to_speak_to_partner"
  | "no_time"
  | "call_back_later"
  | "dont_understand"
  | "doesnt_apply"
  | "dont_need_it"
  | "already_tried_similar"
  | "dont_want_to_switch"
  | "concern_implementation"
  | "concern_switching";

export const OBJECTION_TYPES: { value: ObjectionType; label: string }[] = [
  { value: "not_interested", label: "Not interested" },
  { value: "too_expensive", label: "Too expensive" },
  { value: "happy_with_current", label: "Happy with current system" },
  { value: "already_have_software", label: "Already have software" },
  { value: "already_have_someone", label: "Already have someone doing this" },
  { value: "send_information", label: "Send information" },
  { value: "need_to_think", label: "Need to think" },
  { value: "need_to_speak_to_partner", label: "Need to speak to partner" },
  { value: "no_time", label: "No time" },
  { value: "call_back_later", label: "Call back later" },
  { value: "dont_understand", label: "Don't understand" },
  { value: "doesnt_apply", label: "Doesn't apply to us" },
  { value: "dont_need_it", label: "We don't need it" },
  { value: "already_tried_similar", label: "Already tried something similar" },
  { value: "dont_want_to_switch", label: "Don't want to switch" },
  { value: "concern_implementation", label: "Concern about implementation" },
  { value: "concern_switching", label: "Concern about switching" },
];

export interface Branch {
  id: string;
  title: string; // must describe what happened, e.g. "They dislike current software" — never "Continue"
  speaker: Speaker;
  type: BranchType;
  stage: string;
  category: string; // coarse topic grouping shared across trees — see lib/branch-category.ts
  trigger: string;
  responseText: string;
  responseAlt: string | null;
  objective: string;
  notes: string | null;
  warning: string | null;
  tags: string[]; // doubles as "keywords" for search
  aiKeywords: string[];
  nextBranchIds: string[];
  previousBranchId: string | null;
  order: number;
  isRoot: boolean;
  terminal: boolean; // computed — see lib/branch-utils.ts toBranchWriteData
  outcome: CallOutcome | null;
  objectionType: ObjectionType | null;
  aiConfidenceThreshold: number | null;
  branchPriority: number;
  abTestGroup: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BranchInput = Omit<Branch, "id" | "createdAt" | "updatedAt" | "terminal">;

export type CallStatus = "LIVE" | "PAUSED" | "ENDED";

export type CallOutcome =
  | "discovery_booked"
  | "callback"
  | "decision_maker_unavailable"
  | "interested"
  | "information_requested"
  | "not_interested"
  | "wrong_number"
  | "no_fit"
  | "follow_up_required"
  | "referred"
  | "no_answer"
  | "voicemail"
  | "other";

export const CALL_OUTCOMES: { value: CallOutcome; label: string }[] = [
  { value: "discovery_booked", label: "Discovery booked" },
  { value: "callback", label: "Callback booked" },
  { value: "decision_maker_unavailable", label: "Decision-maker unavailable" },
  { value: "interested", label: "Interested" },
  { value: "information_requested", label: "Information requested" },
  { value: "not_interested", label: "Not interested" },
  { value: "wrong_number", label: "Wrong number" },
  { value: "no_fit", label: "No fit" },
  { value: "follow_up_required", label: "Follow-up required" },
  { value: "referred", label: "Referred to another person" },
  { value: "no_answer", label: "No answer" },
  { value: "voicemail", label: "Voicemail" },
  { value: "other", label: "Other" },
];

// Outcomes that mean "we should capture a structured follow-up window"
export const FOLLOW_UP_OUTCOMES: CallOutcome[] = ["callback", "follow_up_required"];

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
  followUpDate: string | null;
  followUpTimezone: string | null;
  followUpContactName: string | null;
  followUpContactNumber: string | null;
  followUpNotes: string | null;
  summary: string | null;
  recordingConsent: boolean | null;
  recordingStatus: "not_recording" | "recording" | "recorded";
  createdAt: string;
}

export interface CallWithRelations extends Call {
  events: CallEvent[];
  notes: Note[];
  clinic: Clinic;
  transcript: TranscriptChunkRecord[];
  aiSuggestions: AiSuggestionRecord[];
  coachingNotes: CoachingNoteRecord[];
}

// ---------------------------------------------------------------------------
// AI / transcript architecture
//
// V1 ships with a keyword-matching mock (lib/branch-suggestion.ts) and
// manually-typed transcript chunks (the rep types/pastes what was said).
// Swapping in real speech-to-text and a real LLM means changing what feeds
// these tables — the schema, API contract, and accept/ignore UI don't change.
// See README "AI architecture" for the full explanation.
// ---------------------------------------------------------------------------

export interface TranscriptChunk {
  speaker: Speaker;
  text: string;
  timestamp: number;
}

export interface TranscriptChunkRecord {
  id: string;
  callId: string;
  speaker: Speaker;
  text: string;
  source: "manual" | "mic" | "import";
  timestamp: string;
}

export type AiSuggestionStatus = "pending" | "accepted" | "rejected" | "ignored";

export interface BranchSuggestion {
  transcript: string;
  suggestedBranchId: string | null;
  confidence: number;
}

export interface AiSuggestionRecord {
  id: string;
  callId: string;
  transcriptChunkId: string | null;
  suggestedBranchId: string | null;
  confidence: number;
  status: AiSuggestionStatus;
  selectedAlternativeBranchId: string | null;
  createdAt: string;
  respondedAt: string | null;
}

export type ConfidenceBand = "high" | "medium" | "low";

export function confidenceBand(confidence: number): ConfidenceBand {
  if (confidence >= 0.9) return "high";
  if (confidence >= 0.75) return "medium";
  return "low";
}

export interface CoachingNoteRecord {
  id: string;
  callId: string;
  situation: string;
  recommendedQuestion: string;
  trigger: "manual" | "auto";
  createdAt: string;
}
