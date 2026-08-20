"use client";

import { useState } from "react";
import { ShieldAlert, ChevronLeft, Copy, Check } from "lucide-react";
import type { Branch } from "@/lib/types";
import { OBJECTION_CLASSIFICATIONS } from "@/lib/types";
import type { QuickObjection } from "@/lib/quick-objections";

// A pure reference panel — picking an objection here never touches the
// call's actual position (no handleSelect, no API call). It used to; that's
// why hitting "they're okay to continue" after an objection would dead-end
// the call instead of resuming where the conversation actually was. Now
// there is nothing to resume from, because nothing ever moved.
export function ObjectionsPanel({
  objections,
  branchMap,
}: {
  objections: QuickObjection[];
  branchMap: Map<string, Branch>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const resolved = objections
    .map((o) => ({ label: o.label, branch: branchMap.get(o.branchId) }))
    .filter((o): o is { label: string; branch: Branch } => Boolean(o.branch));

  if (resolved.length === 0) return null;

  const selected = selectedId ? resolved.find((o) => o.branch.id === selectedId) : undefined;

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — non-critical
    }
  }

  const classificationLabel = selected?.branch.classification
    ? OBJECTION_CLASSIFICATIONS.find((c) => c.value === selected.branch.classification)?.label
    : null;

  return (
    <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.03] p-4">
      {selected ? (
        <div>
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-amber-300/70 transition-colors duration-150 hover:text-amber-200"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            All objections
          </button>

          <p className="mt-3 text-[11px] font-semibold uppercase tracking-widest text-amber-400/70">
            {classificationLabel ?? "Objection"}
          </p>
          <p className="mt-1 text-base font-semibold text-white">{selected.label}</p>

          {selected.branch.trigger && (
            <p className="mt-2 text-xs italic text-white/45">&ldquo;{selected.branch.trigger}&rdquo;</p>
          )}

          <p className="mt-3 text-[11px] font-semibold uppercase tracking-widest text-indigo-300">Say</p>
          <p className="mt-1 text-base font-medium leading-snug text-white">{selected.branch.responseText}</p>

          <button
            type="button"
            onClick={() => handleCopy(selected.branch.responseText)}
            className="mt-3 flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-white/70 transition-colors duration-150 hover:bg-white/[0.08]"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>

          {selected.branch.whyItWorks && (
            <p className="mt-3 rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-white/50">{selected.branch.whyItWorks}</p>
          )}

          <p className="mt-4 border-t border-white/10 pt-3 text-xs text-white/40">
            Say it, then carry straight on — this panel never moves the call forward on its own.
          </p>
        </div>
      ) : (
        <div>
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-400/80">
            <ShieldAlert className="h-3.5 w-3.5" />
            Instant objections — any moment
          </span>
          <div className="mt-3 space-y-2">
            {resolved.map(({ label, branch }) => (
              <button
                key={branch.id}
                type="button"
                onClick={() => setSelectedId(branch.id)}
                className="block w-full cursor-pointer rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2.5 text-left text-sm font-semibold text-amber-200 transition-colors duration-150 hover:bg-amber-500/[0.12]"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
