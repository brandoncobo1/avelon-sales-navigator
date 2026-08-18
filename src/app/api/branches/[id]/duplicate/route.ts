import { NextRequest, NextResponse } from "next/server";
import { duplicateBranch } from "@/lib/branches";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const branch = await duplicateBranch(id);
    return NextResponse.json({ branch }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Branch not found" }, { status: 404 });
  }
}
