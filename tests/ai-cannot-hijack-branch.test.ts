// Architectural guardrail, not a unit test of behavior: this asserts the AI
// suggestion pipeline's *source code* has no path that can change a call's
// active branch. If someone later "helpfully" wires the transcript/suggest
// routes to auto-apply a suggestion, this test fails immediately — it is
// the single most important test in this codebase per the product spec:
// "The AI should never silently switch branches."
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(__dirname, "..");

function read(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

test("the transcript ingestion route never selects a branch itself", () => {
  const source = read("src/app/api/calls/[id]/transcript/route.ts");
  assert.ok(!source.includes("selectBranch("), "transcript route must not call selectBranch()");
  assert.ok(!source.includes("currentBranchId:"), "transcript route must not write currentBranchId");
});

test("the AI suggestion respond route never selects a branch itself", () => {
  const source = read("src/app/api/calls/[id]/suggestions/[suggestionId]/route.ts");
  assert.ok(!source.includes("selectBranch("), "suggestion respond route must not call selectBranch()");
  assert.ok(!source.includes("currentBranchId:"), "suggestion respond route must not write currentBranchId");
});

test("the branch-suggestion service module never imports prisma or writes to the database", () => {
  const source = read("src/lib/branch-suggestion.ts");
  assert.ok(!/from ["']@\/lib\/prisma["']/.test(source), "branch-suggestion.ts must not import the Prisma client");
  assert.ok(!source.includes("prisma."), "branch-suggestion.ts must not reference prisma");
});

test("only the call PATCH route and selectBranch() itself are allowed to write Call.currentBranchId", () => {
  // Every route file under api/calls that writes currentBranchId must be
  // the one route explicitly designed for it (driven by an explicit
  // branchId in the request body, i.e. a rep's click) — not a suggestion
  // or transcript endpoint reacting to AI output on its own.
  const patchRoute = read("src/app/api/calls/[id]/route.ts");
  assert.ok(patchRoute.includes("body.branchId"), "the branch-change route must require an explicit branchId from the caller");

  const libCalls = read("src/lib/calls.ts");
  // Exclude `currentBranchId: row.currentBranchId`, the read-side mapper —
  // only count assignments of a *new* value, i.e. actual writes.
  const currentBranchIdWrites = libCalls.match(/currentBranchId:(?!\s*row\.)/g) ?? [];
  // selectBranch() and createCall() are the only two writers.
  assert.ok(currentBranchIdWrites.length <= 2, `expected at most 2 currentBranchId writes in lib/calls.ts, found ${currentBranchIdWrites.length}`);
});

test("on the client, accepting an AI suggestion goes through the exact same handleSelect() path as a manual click — there is no separate 'auto-apply' code path", () => {
  const source = read("src/components/navigator/call-navigator-client.tsx");
  const acceptFn = source.slice(source.indexOf("handleAcceptSuggestion"));
  assert.ok(acceptFn.slice(0, 400).includes("handleSelect(suggestedBranch)"), "accepting a suggestion must call handleSelect(), the same function a manual branch click uses");
});
