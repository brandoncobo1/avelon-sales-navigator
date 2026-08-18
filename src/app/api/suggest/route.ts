import { NextRequest, NextResponse } from "next/server";
import { getAllBranches } from "@/lib/branches";
import { branchSuggestionService } from "@/lib/branch-suggestion";
import type { TranscriptChunk } from "@/lib/types";

// Mock AI branch suggestion endpoint. A future live-transcript system posts
// { speaker, text, timestamp } chunks here and gets back a suggested branch
// + confidence. The rep always confirms before the app moves — see README.
export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<TranscriptChunk> & { candidateBranchIds?: string[] };
  if (!body.text || !body.speaker) {
    return NextResponse.json({ error: "speaker and text are required" }, { status: 400 });
  }

  const allBranches = await getAllBranches();
  const candidates = body.candidateBranchIds
    ? allBranches.filter((b) => body.candidateBranchIds!.includes(b.id))
    : allBranches;

  const suggestion = await branchSuggestionService.suggest(
    { speaker: body.speaker, text: body.text, timestamp: body.timestamp ?? Date.now() },
    candidates,
  );

  return NextResponse.json({ suggestion });
}
