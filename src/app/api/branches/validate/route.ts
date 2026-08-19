import { NextResponse } from "next/server";
import { getAllBranches } from "@/lib/branches";
import { validateBranches } from "@/lib/branch-validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const branches = await getAllBranches();
  const report = validateBranches(branches);
  return NextResponse.json({ report });
}
