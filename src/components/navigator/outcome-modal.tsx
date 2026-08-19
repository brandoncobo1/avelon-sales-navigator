"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { CALL_OUTCOMES, FOLLOW_UP_OUTCOMES, type CallOutcome } from "@/lib/types";

export interface FollowUpInput {
  date: string | null;
  timezone: string | null;
  contactName: string | null;
  contactNumber: string | null;
  notes: string | null;
}

export function OutcomeModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (outcome: CallOutcome, notes: string, followUp: FollowUpInput | null) => Promise<void>;
}) {
  const [outcome, setOutcome] = useState<CallOutcome | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTimezone, setFollowUpTimezone] = useState("Europe/London");
  const [contactName, setContactName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");

  const needsFollowUp = outcome ? FOLLOW_UP_OUTCOMES.includes(outcome) : false;

  async function handleSave() {
    if (!outcome) return;
    setSaving(true);
    await onSave(
      outcome,
      notes,
      needsFollowUp
        ? {
            date: followUpDate || null,
            timezone: followUpTimezone || null,
            contactName: contactName || null,
            contactNumber: contactNumber || null,
            notes: followUpNotes || null,
          }
        : null,
    );
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/60 p-4 md:items-center">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#12141a] p-5 shadow-2xl md:p-6">
        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-white">Call outcome</p>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-white/40 hover:text-white/80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {CALL_OUTCOMES.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setOutcome(o.value)}
              className={`cursor-pointer rounded-xl border px-3 py-3 text-left text-sm font-semibold transition-colors duration-150 ${
                outcome === o.value
                  ? "border-indigo-400/50 bg-indigo-500/15 text-indigo-200"
                  : "border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06]"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {needsFollowUp && (
          <div className="mt-4 space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Follow-up details</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="datetime-local"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
              />
              <select
                value={followUpTimezone}
                onChange={(e) => setFollowUpTimezone(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none"
              >
                <option value="Europe/London">Europe/London</option>
                <option value="Europe/Dublin">Europe/Dublin</option>
                <option value="UTC">UTC</option>
              </select>
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Contact name"
                className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:outline-none"
              />
              <input
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="Contact number"
                className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:outline-none"
              />
            </div>
            <textarea
              value={followUpNotes}
              onChange={(e) => setFollowUpNotes(e.target.value)}
              rows={2}
              placeholder="Follow-up notes..."
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:outline-none"
            />
          </div>
        )}

        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Notes</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add what they told you..."
            className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:outline-none"
          />
        </div>

        <button
          type="button"
          disabled={!outcome || saving}
          onClick={handleSave}
          className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Save Call
        </button>
      </div>
    </div>
  );
}
