"use client";

import { ShieldAlert } from "lucide-react";
import type { Branch } from "@/lib/types";
import type { QuickObjection } from "@/lib/quick-objections";

export function QuickObjectionsBar({
  objections,
  branchMap,
  currentBranchId,
  onSelect,
}: {
  objections: QuickObjection[];
  branchMap: Map<string, Branch>;
  currentBranchId: string;
  onSelect: (branch: Branch) => void;
}) {
  const resolved = objections
    .map((o) => ({ label: o.label, branch: branchMap.get(o.branchId) }))
    .filter((o): o is { label: string; branch: Branch } => Boolean(o.branch));

  if (resolved.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-500/15 bg-amber-500/[0.04] px-3 py-2">
      <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-amber-400/80">
        <ShieldAlert className="h-3 w-3" />
        Any moment:
      </span>
      {resolved.map(({ label, branch }) => (
        <button
          key={branch.id}
          type="button"
          disabled={branch.id === currentBranchId}
          onClick={() => onSelect(branch)}
          className="cursor-pointer rounded-full border border-amber-500/25 bg-amber-500/[0.08] px-2.5 py-1 text-[11px] font-semibold text-amber-300 transition-colors duration-150 hover:bg-amber-500/[0.16] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
