import { prisma } from "@/lib/prisma";
import { seedBranches, type SeedBranch } from "@/data/seed-branches";
import { validateBranches } from "@/lib/branch-validation";

function toRowData(branch: SeedBranch) {
  return {
    title: branch.title,
    speaker: branch.speaker,
    type: branch.type,
    stage: branch.stage,
    category: branch.category,
    trigger: branch.trigger,
    responseText: branch.responseText,
    responseAlt: branch.responseAlt,
    objective: branch.objective,
    notes: branch.notes,
    warning: branch.warning,
    tags: JSON.stringify(branch.tags),
    aiKeywords: JSON.stringify(branch.aiKeywords),
    nextBranchIds: JSON.stringify(branch.nextBranchIds),
    previousBranchId: branch.previousBranchId,
    order: branch.order,
    isRoot: branch.isRoot,
    terminal: branch.nextBranchIds.length === 0,
    outcome: branch.outcome,
    objectionType: branch.objectionType,
    aiConfidenceThreshold: branch.aiConfidenceThreshold,
    branchPriority: branch.branchPriority,
    abTestGroup: branch.abTestGroup,
  };
}

// Shared by prisma/seed.ts (CLI) and the Settings "Reset conversation script"
// action, so both stay in sync with the same seed data. Validates the
// in-code branch data BEFORE writing anything — a broken seed should never
// reach the database.
export async function seedConversationTree() {
  const report = validateBranches(seedBranches);
  if (report.errors.length > 0) {
    const summary = report.errors.map((e) => `  [${e.branchId ?? "-"}] ${e.message}`).join("\n");
    throw new Error(`Refusing to seed: ${report.errors.length} branch validation error(s):\n${summary}`);
  }

  for (const branch of seedBranches) {
    const data = toRowData(branch);
    await prisma.branch.upsert({
      where: { id: branch.id },
      create: { id: branch.id, ...data },
      update: data,
    });
  }
  return seedBranches.length;
}
