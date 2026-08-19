import { prisma } from "@/lib/prisma";
import { toBranch, toBranchWriteData } from "@/lib/branch-utils";
import type { Branch, BranchInput } from "@/lib/types";

export async function getAllBranches(): Promise<Branch[]> {
  const rows = await prisma.branch.findMany({ orderBy: { order: "asc" } });
  return rows.map(toBranch);
}

export async function getBranchById(id: string): Promise<Branch | null> {
  const row = await prisma.branch.findUnique({ where: { id } });
  return row ? toBranch(row) : null;
}

export async function createBranch(input: BranchInput): Promise<Branch> {
  const row = await prisma.branch.create({ data: toBranchWriteData(input) as never });
  return toBranch(row);
}

export async function updateBranch(id: string, input: Partial<BranchInput>): Promise<Branch> {
  const row = await prisma.branch.update({ where: { id }, data: toBranchWriteData(input) });
  return toBranch(row);
}

export async function deleteBranch(id: string): Promise<void> {
  // Detach references from any branch that lists this one as a next branch,
  // so the tree never points at a deleted node.
  const all = await prisma.branch.findMany();
  for (const row of all) {
    const branch = toBranch(row);
    if (branch.nextBranchIds.includes(id)) {
      await updateBranch(branch.id, {
        nextBranchIds: branch.nextBranchIds.filter((n) => n !== id),
      });
    }
  }
  await prisma.branch.delete({ where: { id } });
}

export async function duplicateBranch(id: string): Promise<Branch> {
  const source = await getBranchById(id);
  if (!source) throw new Error("Branch not found");
  const row = await prisma.branch.create({
    data: toBranchWriteData({
      ...source,
      title: `${source.title} (copy)`,
      nextBranchIds: [],
    }) as never,
  });
  return toBranch(row);
}

export async function searchBranches(query: string): Promise<Branch[]> {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return getAllBranches();
  const all = await getAllBranches();
  return all.filter((b) => {
    const haystack = [
      b.title,
      b.trigger,
      b.responseText,
      b.objective,
      b.category,
      b.stage,
      ...b.tags,
      ...b.aiKeywords,
    ]
      .join(" ")
      .toLowerCase();
    // Every word must appear somewhere, not necessarily as one contiguous
    // phrase — see ChooseBranchModal for the same reasoning.
    return words.every((w) => haystack.includes(w));
  });
}
