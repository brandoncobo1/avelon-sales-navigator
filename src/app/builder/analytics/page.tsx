import Link from "next/link";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { getBranchAnalytics } from "@/lib/branch-analytics";
import { BranchTypeBadge } from "@/components/ui/branch-type-badge";
import type { BranchType } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BranchAnalyticsPage() {
  const rows = await getBranchAnalytics();

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 md:px-8 md:py-10">
      <Link href="/builder" className="flex items-center gap-1.5 text-xs font-semibold text-white/40 hover:text-white/70">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to builder
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-white">Branch Analytics</h1>
      <p className="mt-1 text-sm text-white/50">
        Which branches get used, and which ones actually lead to a booked discovery call.
      </p>

      {rows.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/15 py-16 text-center">
          <BarChart3 className="h-6 w-6 text-white/25" />
          <p className="text-sm text-white/50">No call data yet — run some calls first.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wide text-white/40">
                <th className="px-4 py-3 font-semibold">Branch</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold text-right">Encountered</th>
                <th className="px-4 py-3 font-semibold text-right">Discovery booked</th>
                <th className="px-4 py-3 font-semibold text-right">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.branchId} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <Link href={`/builder?branch=${row.branchId}`} className="font-medium text-white hover:text-indigo-300">
                      {row.title}
                    </Link>
                    <p className="text-xs text-white/35">{row.category}</p>
                  </td>
                  <td className="px-4 py-3">
                    <BranchTypeBadge type={row.type as BranchType} />
                  </td>
                  <td className="px-4 py-3 text-right text-white/70">{row.timesEncountered}</td>
                  <td className="px-4 py-3 text-right text-white/70">{row.callsWithDiscoveryBooked}</td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-300">
                    {(row.conversionRate * 100).toFixed(1)}%
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
