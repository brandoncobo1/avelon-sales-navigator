import { test } from "node:test";
import assert from "node:assert/strict";
import { validateBranches, type ValidatableBranch } from "../src/lib/branch-validation";
import { seedBranches } from "../src/data/seed-branches";

function makeBranch(overrides: Partial<ValidatableBranch>): ValidatableBranch {
  return {
    id: "b1",
    title: "Test branch",
    type: "QUESTION",
    speaker: "receptionist",
    stage: "test",
    category: "general",
    trigger: "They said something",
    responseText: "Say this",
    objective: "Find out something",
    nextBranchIds: [],
    isRoot: false,
    ...overrides,
  };
}

test("the real seed data has zero validation errors", () => {
  const report = validateBranches(seedBranches as unknown as ValidatableBranch[]);
  assert.deepEqual(
    report.errors,
    [],
    `Seed data must be error-free. Found: ${report.errors.map((e) => e.message).join(" | ")}`,
  );
});

test("the real seed data has no unreachable branches", () => {
  const report = validateBranches(seedBranches as unknown as ValidatableBranch[]);
  assert.deepEqual(report.unreachableBranchIds, []);
});

test("catches duplicate ids", () => {
  const report = validateBranches([
    makeBranch({ id: "dup", isRoot: true, nextBranchIds: [] }),
    makeBranch({ id: "dup", nextBranchIds: [] }),
  ]);
  assert.ok(report.errors.some((e) => e.code === "DUPLICATE_ID"));
});

test("catches broken transitions (dangling next-branch reference)", () => {
  const report = validateBranches([makeBranch({ id: "a", isRoot: true, nextBranchIds: ["does-not-exist"] })]);
  assert.ok(report.errors.some((e) => e.code === "BROKEN_TRANSITION"));
});

test("catches self-loops", () => {
  const report = validateBranches([makeBranch({ id: "a", isRoot: true, nextBranchIds: ["a"] })]);
  assert.ok(report.warnings.some((w) => w.code === "SELF_LOOP"));
});

test("catches empty required fields", () => {
  const report = validateBranches([makeBranch({ id: "a", isRoot: true, trigger: "", objective: "" })]);
  const empty = report.errors.find((e) => e.code === "EMPTY_REQUIRED_FIELD");
  assert.ok(empty);
  assert.match(empty!.message, /trigger/);
  assert.match(empty!.message, /objective/);
});

test("flags a dead branch (non-terminal type with nowhere to go)", () => {
  const report = validateBranches([makeBranch({ id: "a", isRoot: true, type: "QUESTION", nextBranchIds: [] })]);
  assert.ok(report.warnings.some((w) => w.code === "DEAD_BRANCH"));
});

test("does not flag a SUCCESS/EXIT/CALLBACK leaf as a dead branch", () => {
  const report = validateBranches([makeBranch({ id: "a", isRoot: true, type: "SUCCESS", nextBranchIds: [] })]);
  assert.ok(!report.warnings.some((w) => w.code === "DEAD_BRANCH"));
});

test("flags an orphan branch (no incoming reference, not a root)", () => {
  const report = validateBranches([
    makeBranch({ id: "root", isRoot: true, nextBranchIds: [] }),
    makeBranch({ id: "orphan", isRoot: false, nextBranchIds: [] }),
  ]);
  assert.deepEqual(report.orphanBranchIds, ["orphan"]);
});

test("flags an impossible transition: receptionist speaking straight into a decision-maker branch without a transfer step", () => {
  const report = validateBranches([
    makeBranch({ id: "a", isRoot: true, speaker: "receptionist", type: "QUESTION", nextBranchIds: ["b"] }),
    makeBranch({ id: "b", speaker: "decision_maker", nextBranchIds: [] }),
  ]);
  assert.ok(report.warnings.some((w) => w.code === "IMPOSSIBLE_TRANSITION"));
});

test("does not flag a receptionist -> decision-maker transition through a TRANSFER branch", () => {
  const report = validateBranches([
    makeBranch({ id: "a", isRoot: true, speaker: "receptionist", type: "TRANSFER", nextBranchIds: ["b"] }),
    makeBranch({ id: "b", speaker: "decision_maker", nextBranchIds: [] }),
  ]);
  assert.ok(!report.warnings.some((w) => w.code === "IMPOSSIBLE_TRANSITION"));
});

test("context-aware duplicate titles: same title + same category is flagged as likely accidental", () => {
  const report = validateBranches([
    makeBranch({ id: "a", title: "They don't know", category: "software", isRoot: true, nextBranchIds: [] }),
    makeBranch({ id: "b", title: "They don't know", category: "software", nextBranchIds: [] }),
  ]);
  assert.ok(report.warnings.some((w) => w.code === "DUPLICATE_TITLE_SAME_CONTEXT"));
});

test("context-aware duplicate titles: same title + different category is flagged as lower-severity (different context)", () => {
  const report = validateBranches([
    makeBranch({ id: "a", title: "They don't know", category: "software", isRoot: true, nextBranchIds: [] }),
    makeBranch({ id: "b", title: "They don't know", category: "current-setup", nextBranchIds: [] }),
  ]);
  assert.ok(report.warnings.some((w) => w.code === "DUPLICATE_TITLE_DIFFERENT_CONTEXT"));
  assert.ok(!report.warnings.some((w) => w.code === "DUPLICATE_TITLE_SAME_CONTEXT"));
});

test("regression: a branch mismatch like the historical root/dislike incident is caught as EMPTY or as a title/content mismatch would need a human glance, but is at minimum unreachable-safe", () => {
  // The historical incident: the root branch's title/trigger/response was
  // briefly overwritten with a different branch's content via a UI mistake.
  // That specific failure mode is a same-id content edit, which validation
  // can't detect from content alone (it doesn't second-guess business copy) —
  // but it WOULD have been caught immediately if the edit had also broken
  // the root's outgoing links, which is exactly what unreachable-branch
  // detection exists for. This test just documents that reasoning.
  const report = validateBranches(seedBranches as unknown as ValidatableBranch[]);
  const root = seedBranches.find((b) => b.id === "root")!;
  assert.equal(root.isRoot, true);
  assert.ok(!report.unreachableBranchIds.includes("root"));
});

test("catches content contamination: a branch whose response text is actually a different branch's line, reproducing the historical 'They dislike it held the root's opening line' bug", () => {
  const report = validateBranches([
    makeBranch({ id: "root", isRoot: true, stage: "opening", responseText: "Hi, this is Isse calling about your patient software — got thirty seconds?", nextBranchIds: ["a2-dislike-it"] }),
    makeBranch({ id: "a2-dislike-it", stage: "receptionist-software-dislike", responseText: "Hi, this is Isse calling about your patient software — got thirty seconds?", nextBranchIds: [] }),
  ]);
  const hit = report.warnings.find((w) => w.code === "DUPLICATE_RESPONSE_CONTENT" && w.branchId === "a2-dislike-it");
  assert.ok(hit, "expected a2-dislike-it to be flagged for holding the root's response text");
});

test("does not flag short generic fillers reused across many branches", () => {
  const report = validateBranches([
    makeBranch({ id: "a", isRoot: true, stage: "s1", responseText: "Fair enough, appreciate it.", nextBranchIds: [] }),
    makeBranch({ id: "b", isRoot: true, stage: "s2", responseText: "Fair enough, appreciate it.", nextBranchIds: [] }),
  ]);
  assert.ok(!report.warnings.some((w) => w.code === "DUPLICATE_RESPONSE_CONTENT"));
});

test("does not flag the same response text reused within a single stage (intentional shared probe)", () => {
  const report = validateBranches([
    makeBranch({ id: "a", isRoot: true, stage: "pain-discovery", responseText: "Got you — and how does that affect you guys day-to-day?", nextBranchIds: [] }),
    makeBranch({ id: "b", isRoot: true, stage: "pain-discovery", responseText: "Got you — and how does that affect you guys day-to-day?", nextBranchIds: [] }),
  ]);
  assert.ok(!report.warnings.some((w) => w.code === "DUPLICATE_RESPONSE_CONTENT"));
});
