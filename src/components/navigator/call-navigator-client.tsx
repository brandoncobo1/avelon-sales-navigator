"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { StickyNote, RotateCcw, ArrowLeft, AlertTriangle } from "lucide-react";
import type { Branch, CallOutcome, CallStatus, CallWithRelations, Note, Speaker } from "@/lib/types";
import { CallTopBar } from "@/components/navigator/call-top-bar";
import { Breadcrumb } from "@/components/navigator/breadcrumb";
import { ResponseCard } from "@/components/navigator/response-card";
import { BranchOptions } from "@/components/navigator/branch-options";
import { NoteModal } from "@/components/navigator/note-modal";
import { OutcomeModal } from "@/components/navigator/outcome-modal";
import { KeyboardLegend } from "@/components/navigator/keyboard-legend";

interface HistoryEntry {
  branchId: string;
  timestamp: string;
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

export function CallNavigatorClient({
  call,
  branches,
}: {
  call: CallWithRelations;
  branches: Branch[];
}) {
  const router = useRouter();
  const branchMap = useMemo(() => new Map(branches.map((b) => [b.id, b])), [branches]);

  const initialHistory: HistoryEntry[] = useMemo(
    () =>
      call.events.length > 0
        ? call.events.map((e) => ({ branchId: e.branchId, timestamp: e.timestamp }))
        : [{ branchId: call.currentBranchId ?? "root", timestamp: call.startedAt }],
    [call],
  );

  const [history, setHistory] = useState<HistoryEntry[]>(initialHistory);
  const [speaker, setSpeaker] = useState<Speaker>(call.speaker);
  const [status, setStatus] = useState<CallStatus>(call.status);
  const [notes, setNotes] = useState<Note[]>(call.notes);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [outcomeModalOpen, setOutcomeModalOpen] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    Math.max(0, Math.floor((Date.now() - new Date(call.startedAt).getTime()) / 1000)),
  );
  const [pulseKey, setPulseKey] = useState(0);

  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (statusRef.current === "LIVE") {
        setElapsedSeconds((s) => s + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentBranchId = history[history.length - 1]?.branchId ?? "root";
  const currentBranch = branchMap.get(currentBranchId);

  const trail = useMemo(
    () => history.map((h) => branchMap.get(h.branchId)).filter((b): b is Branch => Boolean(b)),
    [history, branchMap],
  );

  const nextBranches = useMemo(() => {
    if (!currentBranch) return [];
    return currentBranch.nextBranchIds
      .map((id) => branchMap.get(id))
      .filter((b): b is Branch => Boolean(b));
  }, [currentBranch, branchMap]);

  const persistBranch = useCallback(
    (branchId: string, nextSpeaker: Speaker) => {
      fetch(`/api/calls/${call.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId, speaker: nextSpeaker, selectedBy: "rep" }),
      }).catch(() => {});
    },
    [call.id],
  );

  const handleSelect = useCallback(
    (branch: Branch) => {
      setHistory((h) => [...h, { branchId: branch.id, timestamp: new Date().toISOString() }]);
      setSpeaker(branch.speaker);
      setPulseKey((k) => k + 1);
      persistBranch(branch.id, branch.speaker);
    },
    [persistBranch],
  );

  const handleBack = useCallback(() => {
    setHistory((h) => {
      if (h.length <= 1) return h;
      const newHistory = h.slice(0, -1);
      const last = newHistory[newHistory.length - 1];
      const branch = branchMap.get(last.branchId);
      if (branch) setSpeaker(branch.speaker);
      persistBranch(last.branchId, branch?.speaker ?? "receptionist");
      return newHistory;
    });
    setPulseKey((k) => k + 1);
  }, [branchMap, persistBranch]);

  const handleJump = useCallback(
    (index: number) => {
      setHistory((h) => {
        const newHistory = h.slice(0, index + 1);
        const last = newHistory[newHistory.length - 1];
        const branch = branchMap.get(last.branchId);
        if (branch) setSpeaker(branch.speaker);
        persistBranch(last.branchId, branch?.speaker ?? "receptionist");
        return newHistory;
      });
      setPulseKey((k) => k + 1);
    },
    [branchMap, persistBranch],
  );

  const handleTogglePause = useCallback(() => {
    setStatus((s) => {
      const next: CallStatus = s === "LIVE" ? "PAUSED" : "LIVE";
      fetch(`/api/calls/${call.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      }).catch(() => {});
      return next;
    });
  }, [call.id]);

  const handleSaveNote = useCallback(
    (text: string) => {
      const optimistic: Note = {
        id: `local-${Date.now()}`,
        callId: call.id,
        text,
        timestamp: new Date().toISOString(),
      };
      setNotes((n) => [...n, optimistic]);
      fetch(`/api/calls/${call.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      }).catch(() => {});
    },
    [call.id],
  );

  const handleSaveOutcome = useCallback(
    async (outcome: CallOutcome, outcomeNotes: string) => {
      const transferred = trail.some((b) => b.type === "TRANSFER");
      const decisionMakerReached = trail.some((b) => b.speaker === "decision_maker");
      await fetch(`/api/calls/${call.id}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outcome,
          outcomeNotes,
          transferred,
          decisionMakerReached,
          callbackScheduled: outcome === "callback",
          discoveryBooked: outcome === "discovery_booked",
        }),
      }).catch(() => {});
      router.push(`/history/${call.id}`);
    },
    [call.id, router, trail],
  );

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target) || noteModalOpen || outcomeModalOpen) {
        if (e.key === "Escape") {
          setNoteModalOpen(false);
          setOutcomeModalOpen(false);
        }
        return;
      }
      if (/^[1-9]$/.test(e.key)) {
        const idx = Number(e.key) - 1;
        const branch = nextBranches[idx];
        if (branch) handleSelect(branch);
      } else if (e.key === "b" || e.key === "B") {
        handleBack();
      } else if (e.key === "n" || e.key === "N") {
        setNoteModalOpen(true);
      } else if (e.key === "e" || e.key === "E") {
        setOutcomeModalOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nextBranches, handleSelect, handleBack, noteModalOpen, outcomeModalOpen]);

  if (!currentBranch) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <AlertTriangle className="h-8 w-8 text-amber-400" />
        <p className="text-white/80">This branch no longer exists.</p>
        <button
          onClick={handleBack}
          className="cursor-pointer rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <CallTopBar
        clinicName={call.clinicNameSnapshot}
        status={status}
        elapsedSeconds={elapsedSeconds}
        onTogglePause={handleTogglePause}
        onEndCall={() => setOutcomeModalOpen(true)}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white/60">
                {speaker.replace("_", " ")}
              </span>
            </div>
            <Breadcrumb trail={trail} onJump={handleJump} onHome={() => handleJump(0)} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <ResponseCard branch={currentBranch} pulseKey={pulseKey} />
            </div>
            <div className="lg:col-span-2">
              <BranchOptions
                branches={nextBranches}
                onSelect={handleSelect}
                onBack={handleBack}
                onEndCall={() => setOutcomeModalOpen(true)}
                canGoBack={history.length > 1}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#0d0f14] px-4 py-3 md:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={history.length <= 1}
            onClick={handleBack}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/75 transition-colors duration-150 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <button
            type="button"
            onClick={() => setPulseKey((k) => k + 1)}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/75 transition-colors duration-150 hover:bg-white/[0.08]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Repeat line
          </button>
          <button
            type="button"
            onClick={() => setNoteModalOpen(true)}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/75 transition-colors duration-150 hover:bg-white/[0.08]"
          >
            <StickyNote className="h-3.5 w-3.5" />
            Add note {notes.length > 0 && `(${notes.length})`}
          </button>
        </div>
        <KeyboardLegend />
      </div>

      {noteModalOpen && <NoteModal onClose={() => setNoteModalOpen(false)} onSave={handleSaveNote} />}
      {outcomeModalOpen && (
        <OutcomeModal onClose={() => setOutcomeModalOpen(false)} onSave={handleSaveOutcome} />
      )}
    </div>
  );
}
