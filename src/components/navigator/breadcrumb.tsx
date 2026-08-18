"use client";

import { ChevronRight, Home } from "lucide-react";
import type { Branch } from "@/lib/types";

export function Breadcrumb({
  trail,
  onJump,
  onHome,
}: {
  trail: Branch[];
  onJump: (index: number) => void;
  onHome: () => void;
}) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto whitespace-nowrap pb-1 text-xs">
      <button
        type="button"
        onClick={onHome}
        className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 font-medium text-white/40 transition-colors duration-150 hover:text-white/80"
        title="Back to root"
      >
        <Home className="h-3.5 w-3.5" />
      </button>
      {trail.map((branch, i) => {
        const isLast = i === trail.length - 1;
        return (
          <span key={`${branch.id}-${i}`} className="flex shrink-0 items-center gap-1">
            <ChevronRight className="h-3 w-3 text-white/20" />
            <button
              type="button"
              onClick={() => onJump(i)}
              disabled={isLast}
              className={`cursor-pointer rounded-md px-1.5 py-1 font-medium transition-colors duration-150 ${
                isLast ? "cursor-default text-white/85" : "text-white/40 hover:text-white/80"
              }`}
            >
              {branch.title}
            </button>
          </span>
        );
      })}
    </div>
  );
}
