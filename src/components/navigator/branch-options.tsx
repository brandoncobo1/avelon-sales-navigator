"use client";

import { ChevronRight, FlagOff } from "lucide-react";
import type { Branch } from "@/lib/types";
import { BRANCH_TYPE_META } from "@/lib/branch-type-meta";

export function BranchOptions({
  branches,
  onSelect,
  onBack,
  onEndCall,
  canGoBack,
}: {
  branches: Branch[];
  onSelect: (branch: Branch) => void;
  onBack: () => void;
  onEndCall: () => void;
  canGoBack: boolean;
}) {
  if (branches.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center">
        <FlagOff className="mx-auto h-6 w-6 text-white/30" />
        <p className="mt-2 text-sm font-semibold text-white/70">End of this branch</p>
        <p className="mt-1 text-xs text-white/40">There&apos;s nowhere scripted to go from here.</p>
        <div className="mt-4 flex flex-col gap-2">
          {canGoBack && (
            <button
              type="button"
              onClick={onBack}
              className="cursor-pointer rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/80 transition-colors duration-150 hover:bg-white/[0.08]"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={onEndCall}
            className="cursor-pointer rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-indigo-400"
          >
            End Call
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
        If they say:
      </p>
      <div className="space-y-2">
        {branches.map((branch, i) => {
          const meta = BRANCH_TYPE_META[branch.type];
          return (
            <button
              key={branch.id}
              type="button"
              onClick={() => onSelect(branch)}
              className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-left transition-colors duration-150 hover:border-indigo-400/40 hover:bg-indigo-500/[0.08]"
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white/50 ${
                  i < 9 ? "border border-white/15 bg-white/[0.04]" : ""
                }`}
              >
                {i < 9 ? i + 1 : ""}
              </span>
              <span className={`h-2 w-2 shrink-0 rounded-full ${meta.dotClass}`} />
              <span className="flex-1 text-sm font-semibold text-white/90">{branch.title}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-white/25 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-indigo-300" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
