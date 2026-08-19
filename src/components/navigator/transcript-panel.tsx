"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Send, Check, X as XIcon, Bot } from "lucide-react";
import type { AiSuggestionRecord, Branch, Speaker, TranscriptChunkRecord } from "@/lib/types";
import { confidenceBand } from "@/lib/types";

const SPEAKER_LABEL: Record<Speaker, string> = {
  receptionist: "Them",
  decision_maker: "Them",
  rep: "Isse",
  system: "—",
};

export function TranscriptPanel({
  open,
  onToggle,
  transcript,
  pendingSuggestion,
  suggestedBranch,
  onSubmitChunk,
  onAcceptSuggestion,
  onIgnoreSuggestion,
}: {
  open: boolean;
  onToggle: () => void;
  transcript: TranscriptChunkRecord[];
  pendingSuggestion: AiSuggestionRecord | null;
  suggestedBranch: Branch | null;
  onSubmitChunk: (speaker: Speaker, text: string) => void;
  onAcceptSuggestion: () => void;
  onIgnoreSuggestion: () => void;
}) {
  const [speaker, setSpeaker] = useState<Speaker>("receptionist");
  const [text, setText] = useState("");

  function handleSubmit() {
    if (!text.trim()) return;
    onSubmitChunk(speaker, text.trim());
    setText("");
  }

  const band = pendingSuggestion ? confidenceBand(pendingSuggestion.confidence) : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/50">
          Transcript
          {transcript.length > 0 && <span className="text-white/30">({transcript.length})</span>}
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-white/40" /> : <ChevronDown className="h-4 w-4 text-white/40" />}
      </button>

      {open && (
        <div className="border-t border-white/10 p-3">
          {pendingSuggestion && suggestedBranch && band && (
            <div
              className={`mb-3 flex items-center gap-3 rounded-xl border px-3 py-2.5 ${
                band === "high"
                  ? "border-indigo-500/40 bg-indigo-500/10"
                  : band === "medium"
                    ? "border-indigo-500/20 bg-indigo-500/[0.05]"
                    : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <Bot className={`h-4 w-4 shrink-0 ${band === "low" ? "text-white/30" : "text-indigo-300"}`} />
              <div className="min-w-0 flex-1">
                <p className={`text-[11px] font-bold uppercase tracking-wide ${band === "low" ? "text-white/40" : "text-indigo-300"}`}>
                  AI suggestion · {Math.round(pendingSuggestion.confidence * 100)}% ({band})
                </p>
                <p className={`truncate text-sm ${band === "low" ? "text-white/50" : "text-white/85"}`}>{suggestedBranch.title}</p>
              </div>
              <button
                type="button"
                onClick={onAcceptSuggestion}
                className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg bg-indigo-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-400"
              >
                <Check className="h-3.5 w-3.5" />
                Accept
              </button>
              <button
                type="button"
                onClick={onIgnoreSuggestion}
                className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-semibold text-white/60 hover:bg-white/[0.06]"
              >
                <XIcon className="h-3.5 w-3.5" />
                Ignore
              </button>
            </div>
          )}

          <div className="max-h-48 space-y-2 overflow-y-auto">
            {transcript.length === 0 && (
              <p className="text-xs text-white/30">Nothing yet — type what was said below.</p>
            )}
            {transcript.map((chunk) => (
              <div key={chunk.id} className="text-sm">
                <span className="font-semibold text-white/70">{SPEAKER_LABEL[chunk.speaker]}: </span>
                <span className="text-white/60">{chunk.text}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <select
              value={speaker}
              onChange={(e) => setSpeaker(e.target.value as Speaker)}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-2 text-xs text-white focus:border-indigo-400 focus:outline-none"
            >
              <option value="receptionist">Them (reception)</option>
              <option value="decision_maker">Them (decision-maker)</option>
              <option value="rep">Isse</option>
            </select>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="What did they just say?"
              className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSubmit}
              className="shrink-0 cursor-pointer rounded-lg bg-indigo-500 p-2 text-white hover:bg-indigo-400"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-[11px] text-white/25">
            Live speech-to-text isn&apos;t wired up yet — type or paste what was said. See README.
          </p>
        </div>
      )}
    </div>
  );
}
