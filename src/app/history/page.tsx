import Link from "next/link";
import { ArrowRight, Inbox } from "lucide-react";
import { listCalls } from "@/lib/calls";
import { CALL_OUTCOMES } from "@/lib/types";

export const dynamic = "force-dynamic";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(startedAt: string, endedAt: string | null) {
  if (!endedAt) return "—";
  const seconds = Math.max(0, Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

function outcomeLabel(outcome: string | null) {
  if (!outcome) return "In progress";
  return CALL_OUTCOMES.find((o) => o.value === outcome)?.label ?? outcome;
}

export default async function CallHistoryPage() {
  const calls = await listCalls();

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10">
      <h1 className="text-2xl font-semibold text-white">Call History</h1>
      <p className="mt-1 text-sm text-white/50">Every call, its full branch path, and the outcome.</p>

      {calls.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/15 py-16 text-center">
          <Inbox className="h-6 w-6 text-white/25" />
          <p className="text-sm text-white/50">No calls yet.</p>
          <Link href="/call/new" className="text-sm font-semibold text-indigo-300 hover:text-indigo-200">
            Start your first call →
          </Link>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-white/40">
                <th className="px-4 py-3 font-semibold">Clinic</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Duration</th>
                <th className="px-4 py-3 font-semibold">Outcome</th>
                <th className="px-4 py-3 font-semibold">Decision-maker</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {calls.map((call) => (
                <tr key={call.id} className="border-b border-white/5 transition-colors duration-150 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium text-white">{call.clinicNameSnapshot}</td>
                  <td className="px-4 py-3 text-white/60">{formatDate(call.startedAt)}</td>
                  <td className="px-4 py-3 text-white/60">{formatDuration(call.startedAt, call.endedAt)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        call.outcome
                          ? "bg-white/[0.06] text-white/70"
                          : "bg-emerald-500/15 text-emerald-300"
                      }`}
                    >
                      {outcomeLabel(call.outcome)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/60">{call.decisionMakerReached ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/history/${call.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-300 hover:text-indigo-200"
                    >
                      View path
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
