"use client";

import { Pause, Play, PhoneOff, Navigation } from "lucide-react";
import type { CallStatus } from "@/lib/types";

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export function CallTopBar({
  clinicName,
  status,
  elapsedSeconds,
  onTogglePause,
  onEndCall,
}: {
  clinicName: string;
  status: CallStatus;
  elapsedSeconds: number;
  onTogglePause: () => void;
  onEndCall: () => void;
}) {
  const isPaused = status === "PAUSED";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0d0f14] px-4 py-3 md:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400">
          <Navigation className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-semibold text-white/40">Avelon Sales Navigator</p>
          <p className="text-sm font-semibold text-white">{clinicName}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
              isPaused ? "bg-amber-500/15 text-amber-300" : "bg-emerald-500/15 text-emerald-300"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${isPaused ? "bg-amber-400" : "animate-pulse bg-emerald-400"}`}
            />
            {isPaused ? "Paused" : "Live"}
          </span>
          <span className="font-mono text-sm font-semibold tabular-nums text-white/80">
            {formatElapsed(elapsedSeconds)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTogglePause}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/75 transition-colors duration-150 hover:bg-white/[0.08]"
          >
            {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            {isPaused ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            onClick={onEndCall}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-rose-500/90 px-3 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-rose-500"
          >
            <PhoneOff className="h-3.5 w-3.5" />
            End Call
          </button>
        </div>
      </div>
    </div>
  );
}
