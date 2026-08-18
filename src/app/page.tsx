import Link from "next/link";
import {
  Phone,
  Workflow,
  PlayCircle,
  BarChart3,
  Calendar,
  UserCheck,
  PhoneForwarded,
  CalendarClock,
  Timer,
  MessageSquare,
  ShieldAlert,
  Trophy,
} from "lucide-react";
import { getDashboardStats } from "@/lib/stats";
import { StatCard } from "@/components/ui/stat-card";
import { startDemoCallAction } from "@/app/actions";

export const dynamic = "force-dynamic";

function formatDuration(seconds: number | null) {
  if (seconds === null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <p className="text-sm text-white/50">
          Your cold-calling command center — start a call, manage the script, or review history.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/call/new"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-500/20 transition-colors duration-150 hover:bg-indigo-400"
        >
          <Phone className="h-5 w-5" />
          Start New Call
        </Link>
        <Link
          href="/builder"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-4 text-base font-semibold text-white/80 transition-colors duration-150 hover:bg-white/[0.06]"
        >
          <Workflow className="h-5 w-5" />
          Manage Conversation
        </Link>
        <form action={startDemoCallAction} className="flex-1">
          <button
            type="submit"
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-4 text-base font-semibold text-white/80 transition-colors duration-150 hover:bg-white/[0.06]"
          >
            <PlayCircle className="h-5 w-5" />
            Start Demo
          </button>
        </form>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total calls" value={stats.totalCalls} icon={BarChart3} />
        <StatCard label="Calls this week" value={stats.callsThisWeek} icon={Calendar} />
        <StatCard label="Decision-makers reached" value={stats.decisionMakersReached} icon={UserCheck} />
        <StatCard label="Calls transferred" value={stats.callsTransferred} icon={PhoneForwarded} />
        <StatCard label="Follow-ups generated" value={stats.followUpsGenerated} icon={CalendarClock} />
        <StatCard
          label="Avg call duration"
          value={formatDuration(stats.avgCallDurationSeconds)}
          icon={Timer}
        />
        <StatCard
          label="Most common branch"
          value={stats.mostCommonReceptionistBranch ?? "—"}
          icon={MessageSquare}
          hint="Receptionist"
        />
        <StatCard
          label="Most common objection"
          value={stats.mostCommonObjection ?? "—"}
          icon={ShieldAlert}
        />
      </div>

      {stats.mostCommonOutcome && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3">
          <Trophy className="h-4 w-4 shrink-0 text-emerald-400" />
          <p className="text-sm text-emerald-200">
            Most common successful path: <span className="font-semibold">{stats.mostCommonOutcome}</span>
          </p>
        </div>
      )}
    </div>
  );
}
