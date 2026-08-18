import { NextRequest, NextResponse } from "next/server";
import { getCall, selectBranch, setCallStatus } from "@/lib/calls";
import type { CallStatus, Speaker } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const call = await getCall(id);
  if (!call) return NextResponse.json({ error: "Call not found" }, { status: 404 });
  return NextResponse.json({ call });
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = (await request.json()) as {
    branchId?: string;
    speaker?: Speaker;
    selectedBy?: "rep" | "ai";
    status?: CallStatus;
  };

  if (body.branchId) {
    await selectBranch(id, body.branchId, body.speaker ?? "receptionist", body.selectedBy ?? "rep");
  }
  if (body.status) {
    await setCallStatus(id, body.status);
  }

  const call = await getCall(id);
  if (!call) return NextResponse.json({ error: "Call not found" }, { status: 404 });
  return NextResponse.json({ call });
}
