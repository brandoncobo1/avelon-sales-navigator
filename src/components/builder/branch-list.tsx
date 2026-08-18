"use client";

import { useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import type { Branch, BranchType } from "@/lib/types";
import { BRANCH_TYPES } from "@/lib/types";
import { BRANCH_TYPE_META } from "@/lib/branch-type-meta";

export function BranchList({
  branches,
  selectedId,
  onSelect,
  onCreate,
}: {
  branches: Branch[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
}) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const stages = useMemo(
    () => Array.from(new Set(branches.map((b) => b.stage))).sort(),
    [branches],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return branches.filter((b) => {
      if (stageFilter !== "all" && b.stage !== stageFilter) return false;
      if (typeFilter !== "all" && b.type !== typeFilter) return false;
      if (!q) return true;
      return [b.title, b.trigger, b.responseText, b.objective, ...b.tags]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [branches, search, stageFilter, typeFilter]);

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2 border-b border-white/10 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search branches..."
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-2 pl-8 pr-3 text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-xs text-white focus:border-indigo-400 focus:outline-none"
          >
            <option value="all">All stages</option>
            {stages.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-xs text-white focus:border-indigo-400 focus:outline-none"
          >
            <option value="all">All types</option>
            {BRANCH_TYPES.map((t) => (
              <option key={t} value={t}>
                {BRANCH_TYPE_META[t].label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={onCreate}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-indigo-500 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-indigo-400"
        >
          <Plus className="h-3.5 w-3.5" />
          New branch
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <p className="px-2 pb-1 text-[11px] text-white/30">{filtered.length} branches</p>
        <div className="space-y-1">
          {filtered.map((b) => {
            const meta = BRANCH_TYPE_META[b.type as BranchType];
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => onSelect(b.id)}
                className={`flex w-full cursor-pointer flex-col gap-0.5 rounded-lg px-3 py-2 text-left transition-colors duration-150 ${
                  selectedId === b.id ? "bg-indigo-500/15" : "hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dotClass}`} />
                  <span className="truncate text-sm font-medium text-white/90">{b.title}</span>
                </div>
                <span className="truncate pl-3 text-[11px] text-white/35">{b.id}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
