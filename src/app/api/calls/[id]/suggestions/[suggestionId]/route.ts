import { NextRequest, NextResponse } from "next/server";
import { respondToAiSuggestion } from "@/lib/calls";
import type { AiSuggestionStatus } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string; suggestionId: string }>;
}

// PATCH here only ever records the rep's decision — it never touches
// Call.currentBranchId itself. If the rep accepts, the client separately
// calls PATCH /api/calls/[id] with the branchId, exactly like a manual
// click would. Two different rep actions (respond to AI, change branch)
// stay two different API calls on purpose.
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { suggestionId } = await params;
  const body = (await request.json()) as {
    status?: Exclude<AiSuggestionStatus, "pending">;
    selectedAlternativeBranchId?: string | null;
  };
  if (!body.status || !["accepted", "rejected", "ignored"].includes(body.status)) {
    return NextResponse.json({ error: "status must be accepted, rejected, or ignored" }, { status: 400 });
  }
  const suggestion = await respondToAiSuggestion(suggestionId, body.status, body.selectedAlternativeBranchId);
  return NextResponse.json({ suggestion });
}
