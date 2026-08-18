import { NextRequest, NextResponse } from "next/server";
import { createCall, listCalls } from "@/lib/calls";

export async function GET() {
  const calls = await listCalls();
  return NextResponse.json({ calls });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { clinicId?: string; rootBranchId?: string };
  if (!body.clinicId) {
    return NextResponse.json({ error: "clinicId is required" }, { status: 400 });
  }
  try {
    const call = await createCall(body.clinicId, body.rootBranchId ?? "root");
    return NextResponse.json({ call }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create call";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
