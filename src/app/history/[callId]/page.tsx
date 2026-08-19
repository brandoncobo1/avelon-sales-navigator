import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowDown, StickyNote, FileText, CalendarClock, Bot, Sparkles } from "lucide-react";
import { getCall } from "@/lib/calls";
import { getAllBranches } from "@/lib/branches";
import { CALL_OUTCOMES } from "@/lib/types";
import { BranchTypeBadge } from "@/components/ui/branch-type-badge";

function formatDuration(startedAt: string, endedAt: string | null) {
  if (!endedAt) return "In progress";
  const seconds = Math.max(0, Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ callId: string }>;
}) {
  const { callId } = await params;
  const [call, branches] = await Promise.all([getCall(callId), getAllBranches()]);
  if (!call) notFound();

  const branchMap = new Map(branches.map((b) => [b.id, b]));
  const outcomeLabel = call.outcome
    ? CALL_OUTCOMES.find((o) => o.value === call.outcome)?.label ?? call.outcome
    : null;

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 md:px-8 md:py-10">
      <Link href="/history" className="flex items-center gap-1.5 text-xs font-semibold text-white/40 hover:text-white/70">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to history
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">{call.clinicNameSnapshot}</h1>
          <p className="mt-1 text-sm text-white/50">
            {new Date(call.startedAt).toLocaleString("en-GB")} · {formatDuration(call.startedAt, call.endedAt)}
          </p>
        </div>
        {outcomeLabel && (
          <span className="rounded-full bg-emerald-500/15 px-3 py-1.5 text-sm font-semibold text-emerald-300">
            {outcomeLabel}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {call.decisionMakerReached && (
          <span className="rounded-full bg-white/[0.06] px-2.5 py-1 font-semibold text-white/60">Decision-maker reached</span>
        )}
        {call.transferred && (
          <span className="rounded-full bg-white/[0.06] px-2.5 py-1 font-semibold text-white/60">Transferred</span>
        )}
        {call.callbackScheduled && (
          <span className="rounded-full bg-white/[0.06] px-2.5 py-1 font-semibold text-white/60">Callback scheduled</span>
        )}
        {call.discoveryBooked && (
          <span className="rounded-full bg-white/[0.06] px-2.5 py-1 font-semibold text-white/60">Discovery booked</span>
        )}
      </div>

      {call.outcomeNotes && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Outcome notes</p>
          <p className="mt-1 text-sm text-white/70">{call.outcomeNotes}</p>
        </div>
      )}

      {call.summary && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/40">
            <FileText className="h-3.5 w-3.5" />
            Call summary
          </div>
          <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-white/70">{call.summary}</pre>
        </div>
      )}

      {(call.followUpDate || call.followUpContactName || call.followUpContactNumber || call.followUpNotes) && (
        <div className="mt-4 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.06] p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-300">
            <CalendarClock className="h-3.5 w-3.5" />
            Follow-up
          </div>
          {call.followUpDate && (
            <p className="mt-2 text-sm text-white/80">
              {new Date(call.followUpDate).toLocaleString("en-GB")}
              {call.followUpTimezone ? ` (${call.followUpTimezone})` : ""}
            </p>
          )}
          {(call.followUpContactName || call.followUpContactNumber) && (
            <p className="mt-1 text-sm text-white/60">
              {call.followUpContactName}
              {call.followUpContactName && call.followUpContactNumber ? " · " : ""}
              {call.followUpContactNumber}
            </p>
          )}
          {call.followUpNotes && <p className="mt-1 text-sm text-white/50">{call.followUpNotes}</p>}
        </div>
      )}

      <div className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Branch path</p>
        <div className="mt-3 flex flex-col">
          {call.events.map((event, i) => {
            const branch = branchMap.get(event.branchId);
            return (
              <div key={event.id} className="flex flex-col">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/15 text-[11px] font-bold text-white/50">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white/90">
                      {branch?.title ?? "Deleted branch"}
                    </p>
                    {branch && <p className="truncate text-xs text-white/40">{branch.responseText}</p>}
                  </div>
                  {branch && <BranchTypeBadge type={branch.type} />}
                </div>
                {i < call.events.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowDown className="h-3.5 w-3.5 text-white/20" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {call.notes.length > 0 && (
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Notes</p>
          <div className="mt-3 space-y-2">
            {call.notes.map((note) => (
              <div key={note.id} className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/30" />
                <div>
                  <p className="text-sm text-white/75">{note.text}</p>
                  <p className="mt-0.5 text-[11px] text-white/35">
                    {new Date(note.timestamp).toLocaleTimeString("en-GB")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {call.coachingNotes.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/40">
            <Sparkles className="h-3.5 w-3.5" />
            Coaching log
          </div>
          <div className="mt-3 space-y-2">
            {call.coachingNotes.map((note) => (
              <div key={note.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-sm text-white/70">{note.situation}</p>
                <p className="mt-1 text-sm font-medium text-white/85">Ask: &ldquo;{note.recommendedQuestion}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {call.transcript.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/40">
            <Bot className="h-3.5 w-3.5" />
            Transcript
          </div>
          <div className="mt-3 space-y-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            {call.transcript.map((chunk) => (
              <p key={chunk.id} className="text-sm">
                <span className="font-semibold text-white/70">{chunk.speaker.replace("_", " ")}: </span>
                <span className="text-white/60">{chunk.text}</span>
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
