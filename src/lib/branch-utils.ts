import type { Branch as BranchRow } from "@prisma/client";
import type { Branch, BranchInput, BranchType, Speaker } from "@/lib/types";

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
    trigger: row.trigger,
    responseText: row.responseText,
    responseAlt: row.responseAlt,
    objective: row.objective,
    notes: row.notes,
    warning: row.warning,
    tags: parseJsonArray(row.tags),
    nextBranchIds: parseJsonArray(row.nextBranchIds),
    previousBranchId: row.previousBranchId,
    order: row.order,
    isRoot: row.isRoot,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toBranchWriteData(input: Partial<BranchInput>) {
  const data: Record<string, unknown> = { ...input };
  if (input.tags) data.tags = JSON.stringify(input.tags);
  if (input.nextBranchIds) data.nextBranchIds = JSON.stringify(input.nextBranchIds);
  return data;
}
