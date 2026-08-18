import { NextRequest, NextResponse } from "next/server";
import { deleteBranch, getBranchById, updateBranch } from "@/lib/branches";
import type { BranchInput } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const branch = await getBranchById(id);
  if (!branch) return NextResponse.json({ error: "Branch not found" }, { status: 404 });
  return NextResponse.json({ branch });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = (await request.json()) as Partial<BranchInput>;
  try {
    const branch = await updateBranch(id, body);
    return NextResponse.json({ branch });
  } catch {
    return NextResponse.json({ error: "Branch not found" }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    await deleteBranch(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Branch not found" }, { status: 404 });
  }
}
