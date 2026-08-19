import { Target } from "lucide-react";
import type { Branch } from "@/lib/types";

export function StateHeader({ trail, goal }: { trail: Branch[]; goal: string }) {
  const stateLine = trail
    .slice(-3)
    .map((b) => b.title)
    .join("  →  ");

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-white/35">Current state</p>
      <p className="mt-1 text-lg font-semibold leading-snug text-white md:text-xl">{stateLine}</p>
      <div className="mt-3 flex items-center gap-1.5 border-t border-white/10 pt-3">
        <Target className="h-3.5 w-3.5 shrink-0 text-indigo-300" />
        <p className="text-xs font-semibold text-indigo-200">
          GOAL: <span className="font-normal text-indigo-200/80">{goal}</span>
        </p>
      </div>
    </div>
  );
}
