import Link from "next/link";
import { Smartphone, ArrowRight, PhoneOff } from "lucide-react";
import { listCalls } from "@/lib/calls";
import { getAllBranches } from "@/lib/branches";

export const dynamic = "force-dynamic";

function formatElapsed(startedAt: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

// Lets a second device (typically a phone) jump into a call that's already
// live on another device. There's no login — with only a couple of users
// sharing this, the picker itself (which live calls exist right now) is
// enough to find the right one. Opening a call here is just the normal
// /call/[callId] Navigator; CallNavigatorClient polls the server so every
// device viewing the same call stays in sync with whichever one is actually
// driving it forward.
export default async function RemoteControlPage() {
  const [calls, branches] = await Promise.all([listCalls(), getAllBranches()]);
  const branchMap = new Map(branches.map((b) => [b.id, b]));
  const controllable = calls.filter((c) => c.status === "LIVE" || c.status === "PAUSED");

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 md:px-8 md:py-10">
      <div className="flex items-center gap-2">
        <Smartphone className="h-5 w-5 text-indigo-400" />
        <h1 className="text-2xl font-semibold text-white">Remote Control</h1>
      </div>
      <p className="mt-1 text-sm text-white/50">
        Jump into a call that&apos;s already live on another device — pick it up from your phone and it stays in sync everywhere it&apos;s open.
      </p>

      {controllable.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/15 py-16 text-center">
          <PhoneOff className="h-6 w-6 text-white/25" />
          <p className="text-sm text-white/50">No live calls right now.</p>
          <Link href="/call/new" className="text-sm font-semibold text-indigo-300 hover:text-indigo-200">
            Start a call →
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {controllable.map((call) => {
            const currentBranch = call.currentBranchId ? branchMap.get(call.currentBranchId) : null;
            return (
              <Link
                key={call.id}
                href={`/call/${call.id}`}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 transition-colors duration-150 hover:bg-white/[0.06]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-white">{call.clinicNameSnapshot}</p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        call.status === "LIVE" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {call.status}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-white/45">
                    {currentBranch?.title ?? "Just started"} · {formatElapsed(call.startedAt)}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-white/30" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
