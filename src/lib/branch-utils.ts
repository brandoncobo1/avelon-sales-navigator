import type { Branch as BranchRow } from "@prisma/client";
import type { Branch, BranchInput, BranchType, CallOutcome, ObjectionType, Speaker } from "@/lib/types";

function parseJsonArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function toBranch(row: BranchRow): Branch {
  return {
    id: row.id,
    title: row.title,
    speaker: row.speaker as Speaker,
    type: row.type as BranchType,
    stage: row.stage,
    category: row.category,
    trigger: row.trigger,
    responseText: row.responseText,
    responseAlt: row.responseAlt,
    objective: row.objective,
    notes: row.notes,
    warning: row.warning,
    tags: parseJsonArray(row.tags),
    aiKeywords: parseJsonArray(row.aiKeywords),
    nextBranchIds: parseJsonArray(row.nextBranchIds),
    previousBranchId: row.previousBranchId,
    order: row.order,
    isRoot: row.isRoot,
    terminal: row.terminal,
    outcome: row.outcome as CallOutcome | null,
    objectionType: row.objectionType as ObjectionType | null,
    aiConfidenceThreshold: row.aiConfidenceThreshold,
    branchPriority: row.branchPriority,
    abTestGroup: row.abTestGroup,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// `terminal` is never taken from the caller — it's always derived from
// nextBranchIds so the two can never drift out of sync (a branch marked
// terminal="false" with an empty nextBranchIds list is exactly the kind of
// silent mismatch the validation system exists to catch).
export function toBranchWriteData(input: Partial<BranchInput>) {
  const data: Record<string, unknown> = { ...input };
  if (input.tags) data.tags = JSON.stringify(input.tags);
  if (input.aiKeywords) data.aiKeywords = JSON.stringify(input.aiKeywords);
  if (input.nextBranchIds) {
    data.nextBranchIds = JSON.stringify(input.nextBranchIds);
    data.terminal = input.nextBranchIds.length === 0;
  }
  return data;
}
