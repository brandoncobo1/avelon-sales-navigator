"use client";

import { useState } from "react";
import { Copy, Check, Target, Lightbulb, ChevronDown } from "lucide-react";
import type { Branch } from "@/lib/types";
import { OBJECTION_CLASSIFICATIONS } from "@/lib/types";
import { BranchTypeBadge } from "@/components/ui/branch-type-badge";

export function ResponseCard({ branch, pulseKey }: { branch: Branch; pulseKey: number }) {
  const [copied, setCopied] = useState(false);
  const [marked, setMarked] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);

  const classificationLabel = branch.classification
    ? OBJECTION_CLASSIFICATIONS.find((c) => c.value === branch.classification)?.label
    : null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(branch.responseText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — non-critical
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
      {classificationLabel && (
        <span className="inline-flex items-center rounded-full border border-indigo-500/25 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-300">
          {classificationLabel}
        </span>
      )}
      {branch.trigger && (
        <div className="mt-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/35">They said</p>
          <p className="mt-1 text-base text-white/60 italic">&ldquo;{branch.trigger}&rdquo;</p>
        </div>
      )}

      <div key={pulseKey} className="mt-4 animate-[pulse-once_0.6s_ease-out]">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-300">Say</p>
        <p className="mt-2 text-2xl font-semibold leading-snug text-white md:text-3xl">
          {branch.responseText}
        </p>
        {branch.responseAlt && (
          <p className="mt-3 text-sm text-white/45">
            <span className="font-semibold text-white/55">Alt:</span> {branch.responseAlt}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/70 transition-colors duration-150 hover:bg-white/[0.08]"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          onClick={() => setMarked((m) => !m)}
          className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors duration-150 ${
            marked
              ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
              : "border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/[0.08]"
          }`}
        >
          <Check className="h-3.5 w-3.5" />
          {marked ? "Marked as said" : "Mark as said"}
        </button>
      </div>

      <div className="mt-5 flex items-start gap-2 border-t border-white/10 pt-4">
        <Target className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/35">Objective</p>
          <p className="mt-0.5 text-sm text-white/65">{branch.objective}</p>
        </div>
      </div>

      {branch.notes && (
        <p className="mt-3 rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-white/45">{branch.notes}</p>
      )}
      {branch.warning && (
        <p className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          ⚠ {branch.warning}
        </p>
      )}

      {branch.whyItWorks && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setWhyOpen((o) => !o)}
            className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-white/45 hover:text-white/70"
          >
            <Lightbulb className="h-3.5 w-3.5" />
            Why this works
            <ChevronDown className={`h-3 w-3 transition-transform duration-150 ${whyOpen ? "rotate-180" : ""}`} />
          </button>
          {whyOpen && <p className="mt-1.5 rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-white/55">{branch.whyItWorks}</p>}
        </div>
      )}

      <div className="mt-4">
        <BranchTypeBadge type={branch.type} />
      </div>
    </div>
  );
}
