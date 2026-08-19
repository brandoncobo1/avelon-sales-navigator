"use client";

import { Zap, X } from "lucide-react";

export function ConfidenceModeBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.06] px-4 py-2.5">
      <Zap className="h-4 w-4 shrink-0 text-indigo-300" />
      <p className="flex-1 text-xs font-semibold tracking-wide text-indigo-200">
        Don&apos;t retreat. Acknowledge <span className="text-indigo-400">&rarr;</span> Reframe{" "}
        <span className="text-indigo-400">&rarr;</span> Question <span className="text-indigo-400">&rarr;</span> Continue.
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss confidence mode reminder"
        className="shrink-0 cursor-pointer rounded-lg p-1 text-indigo-300/60 hover:text-indigo-200"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
