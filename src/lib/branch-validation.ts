// Branch graph validation. Runs on every seed (a broken seed is refused, not
// written — see seedConversationTree in lib/seed-runner.ts) and powers the
// "Branch Quality" admin page so problems in edits made through the Builder
// are visible before they reach Isse mid-call.
//
// This is the system that would have caught the "They dislike it" branch
// briefly containing the root's opening line — see README "Branch validation".

export interface ValidatableBranch {
  id: string;
  title: string;
  type: string;
  speaker: string;
  stage: string;
  category: string;
  trigger: string;
  responseText: string;
  objective: string;
  nextBranchIds: string[];
  isRoot: boolean;
}

export type IssueSeverity = "error" | "warning";

export interface ValidationIssue {
  severity: IssueSeverity;
  code: string;
  branchId: string | null;
  message: string;
}

export interface ValidationReport {
  totalBranches: number;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  orphanBranchIds: string[];
  unreachableBranchIds: string[];
}

const TERMINAL_OK_TYPES = new Set(["SUCCESS", "EXIT", "CALLBACK"]);

export function validateBranches(branches: ValidatableBranch[]): ValidationReport {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const byId = new Map(branches.map((b) => [b.id, b]));

  // Duplicate IDs
  const seenIds = new Set<string>();
  for (const b of branches) {
    if (seenIds.has(b.id)) {
      errors.push({ severity: "error", code: "DUPLICATE_ID", branchId: b.id, message: `Duplicate branch id "${b.id}".` });
    }
    seenIds.add(b.id);
  }

  // Duplicate titles — context-aware: same title in the same category is a
  // likely accident, same title in a different category is probably fine
  // (e.g. "They don't know" appears once for software and once for the
  // decision-maker's system, in different categories).
  const byTitle = new Map<string, ValidatableBranch[]>();
  for (const b of branches) {
    const key = b.title.trim().toLowerCase();
    if (!key) continue;
    byTitle.set(key, [...(byTitle.get(key) ?? []), b]);
  }
  for (const [title, group] of byTitle.entries()) {
    if (group.length < 2) continue;
    const categories = new Set(group.map((b) => b.category));
    const sameCategory = categories.size === 1;
    for (const b of group) {
      warnings.push({
        severity: "warning",
        code: sameCategory ? "DUPLICATE_TITLE_SAME_CONTEXT" : "DUPLICATE_TITLE_DIFFERENT_CONTEXT",
        branchId: b.id,
        message: sameCategory
          ? `Title "${title}" is reused by ${group.length} branches in the same "${b.category}" category — likely accidental.`
          : `Title "${title}" is reused by ${group.length} branches across different categories (${[...categories].join(", ")}) — probably intentional, worth a glance.`,
      });
    }
  }

  // Broken transitions + self-loops
  for (const b of branches) {
    for (const nextId of b.nextBranchIds) {
      if (nextId === b.id) {
        warnings.push({ severity: "warning", code: "SELF_LOOP", branchId: b.id, message: `Branch "${b.id}" lists itself as a next branch.` });
        continue;
      }
      if (!byId.has(nextId)) {
        errors.push({
          severity: "error",
          code: "BROKEN_TRANSITION",
          branchId: b.id,
          message: `Branch "${b.id}" points to "${nextId}", which doesn't exist.`,
        });
      }
    }
  }

  // Empty required fields
  for (const b of branches) {
    const missing: string[] = [];
    if (!b.title.trim()) missing.push("title");
    if (!b.trigger.trim()) missing.push("trigger");
    if (!b.responseText.trim()) missing.push("say");
    if (!b.objective.trim()) missing.push("objective");
    if (missing.length > 0) {
      errors.push({
        severity: "error",
        code: "EMPTY_REQUIRED_FIELD",
        branchId: b.id,
        message: `Branch "${b.id}" is missing: ${missing.join(", ")}.`,
      });
    }
  }

  // Dead branches — a leaf that isn't a type that reads as an intentional ending
  for (const b of branches) {
    if (b.nextBranchIds.length === 0 && !TERMINAL_OK_TYPES.has(b.type)) {
      warnings.push({
        severity: "warning",
        code: "DEAD_BRANCH",
        branchId: b.id,
        message: `Branch "${b.id}" (${b.type}) has nowhere to go and isn't a SUCCESS/EXIT/CALLBACK ending — check this is intentional.`,
      });
    }
  }

  // Impossible transitions — receptionist speaking directly into a
  // decision-maker branch without a TRANSFER/DECISION_MAKER step
  for (const b of branches) {
    for (const nextId of b.nextBranchIds) {
      const next = byId.get(nextId);
      if (!next) continue;
      if (b.speaker === "receptionist" && next.speaker === "decision_maker" && b.type !== "TRANSFER" && b.type !== "DECISION_MAKER") {
        warnings.push({
          severity: "warning",
          code: "IMPOSSIBLE_TRANSITION",
          branchId: b.id,
          message: `Branch "${b.id}" (receptionist, ${b.type}) leads straight into decision-maker branch "${nextId}" without a transfer step — check this is intentional.`,
        });
      }
    }
  }

  // Orphans — no incoming reference from anywhere, and not a declared root
  const referenced = new Set<string>();
  for (const b of branches) for (const nextId of b.nextBranchIds) referenced.add(nextId);
  const orphanBranchIds = branches.filter((b) => !b.isRoot && !referenced.has(b.id)).map((b) => b.id);
  for (const id of orphanBranchIds) {
    warnings.push({ severity: "warning", code: "ORPHAN_BRANCH", branchId: id, message: `Branch "${id}" has no incoming connection from any other branch.` });
  }

  // Unreachable from any root — distinct from orphan: a branch can be
  // referenced only by another unreachable branch and still never actually
  // be reachable from a real starting point.
  const roots = branches.filter((b) => b.isRoot).map((b) => b.id);
  const reachable = new Set<string>();
  const queue = [...roots];
  while (queue.length) {
    const id = queue.shift()!;
    if (reachable.has(id)) continue;
    reachable.add(id);
    const b = byId.get(id);
    if (!b) continue;
    for (const nextId of b.nextBranchIds) queue.push(nextId);
  }
  const unreachableBranchIds = branches.filter((b) => !reachable.has(b.id)).map((b) => b.id);
  for (const id of unreachableBranchIds) {
    errors.push({ severity: "error", code: "UNREACHABLE", branchId: id, message: `Branch "${id}" cannot be reached from any root branch.` });
  }

  return {
    totalBranches: branches.length,
    errors,
    warnings,
    orphanBranchIds,
    unreachableBranchIds,
  };
}
