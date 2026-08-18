import { prisma } from "@/lib/prisma";
import { seedBranches } from "@/data/seed-branches";

// Shared by prisma/seed.ts (CLI) and the Settings "Reset conversation script"
// action, so both stay in sync with the same seed data.
export async function seedConversationTree() {
  for (const branch of seedBranches) {
    await prisma.branch.upsert({
      where: { id: branch.id },
      create: {
        id: branch.id,
        title: branch.title,
        speaker: branch.speaker,
        type: branch.type,
        stage: branch.stage,
        trigger: branch.trigger,
        responseText: branch.responseText,
        responseAlt: branch.responseAlt,
        objective: branch.objective,
        notes: branch.notes,
        warning: branch.warning,
        tags: JSON.stringify(branch.tags),
        nextBranchIds: JSON.stringify(branch.nextBranchIds),
        previousBranchId: branch.previousBranchId,
        order: branch.order,
        isRoot: branch.isRoot,
      },
      update: {
        title: branch.title,
        speaker: branch.speaker,
        type: branch.type,
        stage: branch.stage,
        trigger: branch.trigger,
        responseText: branch.responseText,
        responseAlt: branch.responseAlt,
        objective: branch.objective,
        notes: branch.notes,
        warning: branch.warning,
        tags: JSON.stringify(branch.tags),
        nextBranchIds: JSON.stringify(branch.nextBranchIds),
        previousBranchId: branch.previousBranchId,
        order: branch.order,
        isRoot: branch.isRoot,
      },
    });
  }
  return seedBranches.length;
}
