import { test } from "node:test";
import assert from "node:assert/strict";
import { MockBranchSuggestionService } from "../src/lib/branch-suggestion";
import type { Branch } from "../src/lib/types";

function makeBranch(overrides: Partial<Branch>): Branch {
  return {
    id: "b1",
    title: "They use software",
    speaker: "receptionist",
    type: "QUESTION",
    stage: "test",
    category: "software",
    trigger: "They mention using a software system like Dentally",
    responseText: "Oh nice, which one?",
    responseAlt: null,
    objective: "Identify the current system",
    notes: null,
    warning: null,
    tags: ["software"],
    aiKeywords: [],
    nextBranchIds: [],
    previousBranchId: null,
    order: 0,
    isRoot: false,
    terminal: false,
    outcome: null,
    objectionType: null,
    aiConfidenceThreshold: null,
    branchPriority: 0,
    abTestGroup: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

test("suggest() is deterministic — same input yields the same output", async () => {
  const service = new MockBranchSuggestionService();
  const candidates = [
    makeBranch({ id: "software", title: "They use software", trigger: "They mention using software like Dentally" }),
    makeBranch({ id: "manual", title: "Pen and paper", trigger: "They say no proper system, mostly pen and paper" }),
  ];
  const chunk = { speaker: "receptionist" as const, text: "We use Dentally at the moment", timestamp: 0 };

  const first = await service.suggest(chunk, candidates);
  const second = await service.suggest(chunk, candidates);
  assert.deepEqual(first, second);
});

test("suggest() returns null with zero confidence when nothing matches", async () => {
  const service = new MockBranchSuggestionService();
  const candidates = [makeBranch({ id: "software", trigger: "They mention using software like Dentally" })];
  const result = await service.suggest({ speaker: "receptionist", text: "zzz qqq unrelated gibberish", timestamp: 0 }, candidates);
  assert.equal(result.suggestedBranchId, null);
  assert.equal(result.confidence, 0);
});

test("suggest() picks the best-matching candidate by keyword overlap", async () => {
  const service = new MockBranchSuggestionService();
  const candidates = [
    makeBranch({ id: "software", title: "Uses software", trigger: "They mention using software like Dentally" }),
    makeBranch({ id: "manual", title: "Pen and paper", trigger: "They say no proper system, mostly pen and paper" }),
  ];
  const result = await service.suggest(
    { speaker: "receptionist", text: "We still use pen and paper for everything", timestamp: 0 },
    candidates,
  );
  assert.equal(result.suggestedBranchId, "manual");
  assert.ok(result.confidence > 0 && result.confidence <= 1);
});

test("suggest()'s return type carries no method to apply itself — accepting it is a separate, explicit act by the caller", async () => {
  const service = new MockBranchSuggestionService();
  const result = await service.suggest({ speaker: "receptionist", text: "anything", timestamp: 0 }, []);
  // The suggestion is plain data: transcript, suggestedBranchId, confidence.
  // There is no "apply"/"commit"/"execute" on it — the caller (the
  // /api/calls/[id]/transcript route) can only log it, never act on it.
  assert.deepEqual(Object.keys(result).sort(), ["confidence", "suggestedBranchId", "transcript"]);
});
