import { NextRequest, NextResponse } from "next/server";
import { addCoachingNote, getCall } from "@/lib/calls";
import { getAllBranches } from "@/lib/branches";
import { heuristicCoach } from "@/lib/call-coach";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const call = await getCall(id);
  if (!call) return NextResponse.json({ error: "Call not found" }, { status: 404 });

  const branches = await getAllBranches();
  const branchMap = new Map(branches.map((b) => [b.id, b]));
  const currentBranch = call.currentBranchId ? (branchMap.get(call.currentBranchId) ?? null) : null;
  const visitedBranches = call.events.map((e) => branchMap.get(e.branchId)).filter((b) => Boolean(b)) as typeof branches;

  const result = heuristicCoach(currentBranch, visitedBranches);
  const note = await addCoachingNote(id, result.situation, result.recommendedQuestion, "manual");

  return NextResponse.json({ coaching: note, doNotPitchYet: result.doNotPitchYet });
}
