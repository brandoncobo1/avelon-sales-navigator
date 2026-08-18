import type { Branch, BranchSuggestion, TranscriptChunk } from "@/lib/types";

// Abstraction the future live-transcript AI system will plug into. V1 ships
// a mock keyword-matching implementation so the rest of the app (UI,
// confirm/reject flow, API contract) can be built and exercised today.
//
// A future real implementation swaps `MockBranchSuggestionService` for one
// backed by an LLM call, keeping the same `suggest()` contract:
// { transcript, suggestedBranchId, confidence } — see README "Future AI
// integration" section.
export interface BranchSuggestionService {
  suggest(
    transcriptChunk: TranscriptChunk,
    candidateBranches: Branch[],
  ): Promise<BranchSuggestion>;
}

export class MockBranchSuggestionService implements BranchSuggestionService {
  async suggest(
    transcriptChunk: TranscriptChunk,
    candidateBranches: Branch[],
  ): Promise<BranchSuggestion> {
    const text = transcriptChunk.text.toLowerCase();

    let best: { branch: Branch; score: number } | null = null;
    for (const branch of candidateBranches) {
      const haystack = [branch.title, branch.trigger, ...branch.tags].join(" ").toLowerCase();
      const words = haystack.split(/[^a-z0-9]+/).filter((w) => w.length > 3);
      const score = words.reduce((acc, word) => (text.includes(word) ? acc + 1 : acc), 0);
      if (score > 0 && (!best || score > best.score)) {
        best = { branch, score };
      }
    }

    if (!best) {
      return { transcript: transcriptChunk.text, suggestedBranchId: null, confidence: 0 };
    }

    const confidence = Math.min(0.5 + best.score * 0.15, 0.97);
    return {
      transcript: transcriptChunk.text,
      suggestedBranchId: best.branch.id,
      confidence: Math.round(confidence * 100) / 100,
    };
  }
}

export const branchSuggestionService: BranchSuggestionService = new MockBranchSuggestionService();
