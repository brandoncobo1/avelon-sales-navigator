"use client";

import { X, Sparkles } from "lucide-react";

export function CoachPanel({
  situation,
  recommendedQuestion,
  onClose,
}: {
  situation: string;
  recommendedQuestion: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/[0.08] px-4 py-3.5">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-300">Coach</p>
        <p className="mt-1 text-sm text-white/70">{situation}</p>
        <p className="mt-1.5 text-sm font-semibold text-white">
          Ask: <span className="font-normal italic">&ldquo;{recommendedQuestion}&rdquo;</span>
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 cursor-pointer rounded-lg p-1 text-white/40 hover:text-white/80"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
