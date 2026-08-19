import { test } from "node:test";
import assert from "node:assert/strict";
import { heuristicCoach } from "../src/lib/call-coach";
import type { Branch } from "../src/lib/types";

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

test("nudges when the same objection classification comes up a second time", () => {
  const first = makeBranch({ id: "obj1", type: "OBJECTION", classification: "price_objection" });
  const root = makeBranch({ id: "root", type: "QUESTION" });
  const second = makeBranch({ id: "obj2", type: "OBJECTION", classification: "price_objection" });
  const result = heuristicCoach(second, [root, first, second]);
  assert.match(result.situation, /earlier in the call/i);
});

test("does not nudge repetition when it's the first time this objection type appears", () => {
  const root = makeBranch({ id: "root", type: "QUESTION" });
  const obj = makeBranch({ id: "obj1", type: "OBJECTION", classification: "price_objection" });
  const result = heuristicCoach(obj, [root, obj]);
  assert.doesNotMatch(result.situation, /earlier in the call/i);
});

test("nudges when wrapping up right after a genuine objection that had another path forward", () => {
  const obj = makeBranch({ id: "obj1", type: "OBJECTION", classification: "real_objection", nextBranchIds: ["exit", "continue"] });
  const exit = makeBranch({ id: "exit", type: "EXIT" });
  const result = heuristicCoach(exit, [obj, exit]);
  assert.match(result.situation, /wrapping up right after a real objection/i);
});

test("does not nudge retreating for a receptionist brush-off (no genuine objection to retreat from)", () => {
  const obj = makeBranch({ id: "obj1", type: "OBJECTION", classification: "receptionist_brush_off", nextBranchIds: ["exit", "continue"] });
  const exit = makeBranch({ id: "exit", type: "EXIT" });
  const result = heuristicCoach(exit, [obj, exit]);
  assert.doesNotMatch(result.situation, /wrapping up right after/i);
});

test("does not nudge retreating when the objection had no alternate path (a genuine dead end)", () => {
  const obj = makeBranch({ id: "obj1", type: "OBJECTION", classification: "real_objection", nextBranchIds: ["exit"] });
  const exit = makeBranch({ id: "exit", type: "EXIT" });
  const result = heuristicCoach(exit, [obj, exit]);
  assert.doesNotMatch(result.situation, /wrapping up right after/i);
});

test("still flags DO NOT PITCH YET when reaching the decision-maker without established pain", () => {
  const dm = makeBranch({ id: "dm", type: "DECISION_MAKER" });
  const result = heuristicCoach(dm, [dm]);
  assert.equal(result.doNotPitchYet, true);
});

test("returns the default no-active-branch result when nothing is selected", () => {
  const result = heuristicCoach(null, []);
  assert.equal(result.situation, "No active branch.");
});
