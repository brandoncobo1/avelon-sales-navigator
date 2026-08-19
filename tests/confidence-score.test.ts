import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreCallConfidence } from "../src/lib/confidence-score";
import type { Branch, CallEvent, CallWithRelations } from "../src/lib/types";

function makeBranch(overrides: Partial<Branch>): Branch {
  return {
    id: "b1",
    title: "Test branch",
    speaker: "receptionist",
    type: "QUESTION",
    stage: "test",
    category: "general",
    trigger: "They said something",
    responseText: "Say this",
    responseAlt: null,
    objective: "Find out something",
    notes: null,
    warning: null,
    tags: [],
    aiKeywords: [],
    nextBranchIds: [],
    previousBranchId: null,
    order: 0,
    isRoot: false,
    terminal: false,
    outcome: null,
    objectionType: null,
    classification: null,
    whyItWorks: null,
    aiConfidenceThreshold: null,
    branchPriority: 0,
    abTestGroup: null,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    ...overrides,
  };
}

function makeEvent(branchId: string, i: number): CallEvent {
  return { id: `e${i}`, callId: "call1", branchId, timestamp: new Date(i * 1000).toISOString(), selectedBy: "rep" };
}

function makeCall(overrides: Partial<CallWithRelations>): CallWithRelations {
  return {
    id: "call1",
    clinicId: "clinic1",
    clinicNameSnapshot: "Test Clinic",
    status: "ENDED",
    startedAt: new Date(0).toISOString(),
    endedAt: new Date(60000).toISOString(),
    currentBranchId: null,
    speaker: "system",
    outcome: null,
    decisionMakerReached: false,
    transferred: false,
    callbackScheduled: false,
    discoveryBooked: false,
    outcomeNotes: null,
    followUpDate: null,
    followUpTimezone: null,
    followUpContactName: null,
    followUpContactNumber: null,
    followUpNotes: null,
    summary: null,
    confidenceScore: null,
    confidenceBreakdown: null,
    recordingConsent: null,
    recordingStatus: "not_recording",
    createdAt: new Date(0).toISOString(),
    events: [],
    notes: [],
    clinic: { id: "clinic1", name: "Test Clinic", website: null, phone: null, location: null, hasCustomAsset: false, practiceNotes: null, isDemo: true, createdAt: new Date(0).toISOString() },
    transcript: [],
    aiSuggestions: [],
    coachingNotes: [],
    ...overrides,
  };
}

test("a call with no objections gets a neutral objection-resilience score, not a penalty", () => {
  const branches = [makeBranch({ id: "root", isRoot: true })];
  const call = makeCall({ events: [makeEvent("root", 0)] });
  const result = scoreCallConfidence(call, branches);
  const component = result.components.find((c) => c.key === "objection_resilience")!;
  assert.equal(component.score, 30);
});

test("pushing through every objection scores full objection-resilience marks", () => {
  const branches = [
    makeBranch({ id: "root", isRoot: true, type: "QUESTION" }),
    makeBranch({ id: "obj1", type: "OBJECTION", classification: "real_objection" }),
    makeBranch({ id: "next", type: "QUESTION" }),
  ];
  const call = makeCall({ events: [makeEvent("root", 0), makeEvent("obj1", 1), makeEvent("next", 2)] });
  const result = scoreCallConfidence(call, branches);
  const component = result.components.find((c) => c.key === "objection_resilience")!;
  assert.equal(component.score, 40);
});

test("folding immediately after every objection scores zero objection-resilience marks", () => {
  const branches = [
    makeBranch({ id: "root", isRoot: true, type: "QUESTION" }),
    makeBranch({ id: "obj1", type: "OBJECTION", classification: "real_objection" }),
  ];
  const call = makeCall({ events: [makeEvent("root", 0), makeEvent("obj1", 1)] });
  const result = scoreCallConfidence(call, branches);
  const component = result.components.find((c) => c.key === "objection_resilience")!;
  assert.equal(component.score, 0);
});

test("momentum score rewards decision-maker reach, transfer, and a booked discovery call", () => {
  const branches = [makeBranch({ id: "root", isRoot: true })];
  const call = makeCall({
    events: [makeEvent("root", 0)],
    decisionMakerReached: true,
    transferred: true,
    discoveryBooked: true,
  });
  const result = scoreCallConfidence(call, branches);
  const component = result.components.find((c) => c.key === "momentum")!;
  assert.equal(component.score, 30);
});

test("a genuine rejection outcome with a prompt stop scores full marks for respecting it", () => {
  const branches = [
    makeBranch({ id: "root", isRoot: true, type: "QUESTION" }),
    makeBranch({ id: "obj1", type: "OBJECTION", classification: "real_objection" }),
    makeBranch({ id: "exit", type: "EXIT" }),
  ];
  const call = makeCall({
    events: [makeEvent("root", 0), makeEvent("obj1", 1), makeEvent("exit", 2)],
    outcome: "not_interested",
  });
  const result = scoreCallConfidence(call, branches);
  const component = result.components.find((c) => c.key === "respects_rejection")!;
  assert.equal(component.score, 15);
});

test("pushing many more steps past a genuine rejection docks the respects-rejection score", () => {
  const branches = [
    makeBranch({ id: "root", isRoot: true, type: "QUESTION" }),
    makeBranch({ id: "obj1", type: "OBJECTION", classification: "real_objection" }),
    makeBranch({ id: "s1", type: "QUESTION" }),
    makeBranch({ id: "s2", type: "QUESTION" }),
    makeBranch({ id: "s3", type: "QUESTION" }),
    makeBranch({ id: "s4", type: "QUESTION" }),
  ];
  const call = makeCall({
    events: [makeEvent("root", 0), makeEvent("obj1", 1), makeEvent("s1", 2), makeEvent("s2", 3), makeEvent("s3", 4), makeEvent("s4", 5)],
    outcome: "not_interested",
  });
  const result = scoreCallConfidence(call, branches);
  const component = result.components.find((c) => c.key === "respects_rejection")!;
  assert.equal(component.score, 4);
});

test("a receptionist brush-off does not count as the genuine objection for the respects-rejection check", () => {
  const branches = [
    makeBranch({ id: "root", isRoot: true, type: "QUESTION" }),
    makeBranch({ id: "brush", type: "OBJECTION", classification: "receptionist_brush_off" }),
    makeBranch({ id: "s1", type: "QUESTION" }),
    makeBranch({ id: "s2", type: "QUESTION" }),
  ];
  const call = makeCall({
    events: [makeEvent("root", 0), makeEvent("brush", 1), makeEvent("s1", 2), makeEvent("s2", 3)],
    outcome: "not_interested",
  });
  const result = scoreCallConfidence(call, branches);
  const component = result.components.find((c) => c.key === "respects_rejection")!;
  // No real objection was ever hit, so eventsAfterLastRealObjection stays 0 — full marks.
  assert.equal(component.score, 15);
});

test("total score is the sum of all components and is clamped within 0-100 by construction", () => {
  const branches = [makeBranch({ id: "root", isRoot: true })];
  const call = makeCall({ events: [makeEvent("root", 0)] });
  const result = scoreCallConfidence(call, branches);
  const sum = result.components.reduce((s, c) => s + c.score, 0);
  assert.equal(result.total, sum);
  assert.ok(result.total >= 0 && result.total <= 100);
});
