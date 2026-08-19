"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { Branch } from "@/lib/types";
import { BranchTypeBadge } from "@/components/ui/branch-type-badge";

export function ChooseBranchModal({
  branches,
  onSelect,
  onClose,
  defaultObjectionsOnly = false,
}: {
  branches: Branch[];
  onSelect: (branch: Branch) => void;
  onClose: () => void;
  defaultObjectionsOnly?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [objectionsOnly, setObjectionsOnly] = useState(defaultObjectionsOnly);

  const scoped = useMemo(
    () => (objectionsOnly ? branches.filter((b) => b.type === "OBJECTION") : branches),
    [branches, objectionsOnly],
  );

  const results = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) return scoped.slice(0, 30);
    return scoped
      .filter((b) => {
        const haystack = [b.title, b.trigger, b.objective, b.category, b.stage, b.id, ...b.tags, ...b.aiKeywords]
          .join(" ")
          .toLowerCase();
        // Every word must appear somewhere — not necessarily as one
        // contiguous phrase — so "manual follow up" matches a branch whose
        // title is "Follow-up problem" tagged "manual-process".
        return words.every((w) => haystack.includes(w));
      })
      .slice(0, 40);
  }, [scoped, query]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-16 md:pt-24">
      <div className="flex max-h-[70vh] w-full max-w-xl flex-col rounded-2xl border border-white/10 bg-[#12141a] shadow-2xl">
        <div className="flex items-center gap-2 border-b border-white/10 p-3">
          <Search className="h-4 w-4 shrink-0 text-white/40" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={objectionsOnly ? "Search objections..." : "Search by title, trigger, keyword, objective, category..."}
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 cursor-pointer rounded-lg p-1 text-white/40 hover:text-white/80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
          <button
            type="button"
            onClick={() => setObjectionsOnly(false)}
            className={`cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors duration-150 ${
              !objectionsOnly ? "bg-white/[0.1] text-white" : "text-white/40 hover:text-white/70"
            }`}
          >
            All branches
          </button>
          <button
            type="button"
            onClick={() => setObjectionsOnly(true)}
            className={`cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors duration-150 ${
              objectionsOnly ? "bg-indigo-500/20 text-indigo-300" : "text-white/40 hover:text-white/70"
            }`}
          >
            Objections only
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {results.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-white/40">No branches match &ldquo;{query}&rdquo;.</p>
          )}
          <div className="space-y-1">
            {results.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => onSelect(b)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 hover:bg-white/[0.06]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white/90">{b.title}</p>
                  <p className="truncate text-xs text-white/40">{b.category} · {b.stage}</p>
                </div>
                <BranchTypeBadge type={b.type} className="shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
