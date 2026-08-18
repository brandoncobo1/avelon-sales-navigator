import { NextRequest, NextResponse } from "next/server";
import { endCall, type EndCallInput } from "@/lib/calls";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = (await request.json()) as EndCallInput;
  if (!body.outcome) {
    return NextResponse.json({ error: "outcome is required" }, { status: 400 });
  }
  const call = await endCall(id, body);
  return NextResponse.json({ call });
}
