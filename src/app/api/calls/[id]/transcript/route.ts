import { NextRequest, NextResponse } from "next/server";
import { addTranscriptChunk, getCall, logAiSuggestion } from "@/lib/calls";
import { getAllBranches } from "@/lib/branches";
import { branchSuggestionService } from "@/lib/branch-suggestion";
import type { Speaker } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Adds a transcript chunk and immediately asks the (currently mock)
// suggestion service to react to it, logging the result either way. This
// NEVER changes the call's active branch — see lib/branch-suggestion.ts and
// tests/ai-cannot-hijack-branch.test.ts for the guarantee.
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = (await request.json()) as { speaker?: Speaker; text?: string; source?: "manual" | "mic" | "import" };
  if (!body.speaker || !body.text?.trim()) {
    return NextResponse.json({ error: "speaker and text are required" }, { status: 400 });
  }

  const chunk = await addTranscriptChunk(id, body.speaker, body.text.trim(), body.source ?? "manual");

  const call = await getCall(id);
  if (!call) return NextResponse.json({ error: "Call not found" }, { status: 404 });

  const allBranches = await getAllBranches();
  const currentBranch = call.currentBranchId ? allBranches.find((b) => b.id === call.currentBranchId) : null;
  const candidates = currentBranch
    ? currentBranch.nextBranchIds.map((nid) => allBranches.find((b) => b.id === nid)).filter((b) => Boolean(b))
    : allBranches;

  const suggestion = await branchSuggestionService.suggest(
    { speaker: body.speaker, text: body.text.trim(), timestamp: Date.now() },
    candidates as never,
  );

  const logged = await logAiSuggestion(id, chunk.id, suggestion.suggestedBranchId, suggestion.confidence);

  return NextResponse.json({ chunk, suggestion: logged });
}
