import { NextRequest, NextResponse } from "next/server";
import { createBranch, getAllBranches, searchBranches } from "@/lib/branches";
import type { BranchInput } from "@/lib/types";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");
  const branches = q ? await searchBranches(q) : await getAllBranches();
  return NextResponse.json({ branches });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<BranchInput>;
  if (!body.title || !body.responseText) {
    return NextResponse.json({ error: "title and responseText are required" }, { status: 400 });
  }
  const branch = await createBranch({
    title: body.title,
    speaker: body.speaker ?? "receptionist",
    type: body.type ?? "SCRIPT",
    stage: body.stage ?? "custom",
    trigger: body.trigger ?? "",
    responseText: body.responseText,
    responseAlt: body.responseAlt ?? null,
    objective: body.objective ?? "",
    notes: body.notes ?? null,
    warning: body.warning ?? null,
    tags: body.tags ?? [],
    nextBranchIds: body.nextBranchIds ?? [],
    previousBranchId: body.previousBranchId ?? null,
    order: body.order ?? 0,
    isRoot: body.isRoot ?? false,
  });
  return NextResponse.json({ branch }, { status: 201 });
}
