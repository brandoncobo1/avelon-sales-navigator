import Link from "next/link";
import { AlertCircle, AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { getAllBranches } from "@/lib/branches";
import { validateBranches, type ValidationIssue } from "@/lib/branch-validation";

export const dynamic = "force-dynamic";

function IssueRow({ issue }: { issue: ValidationIssue }) {
  const isError = issue.severity === "error";
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
        isError ? "border-rose-500/20 bg-rose-500/[0.06]" : "border-amber-500/20 bg-amber-500/[0.06]"
      }`}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
      ) : (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
      )}
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${isError ? "text-rose-200" : "text-amber-200"}`}>{issue.message}</p>
        <p className="mt-0.5 text-[11px] uppercase tracking-wide text-white/30">{issue.code}</p>
      </div>
      {issue.branchId && (
        <Link
          href={`/builder?branch=${issue.branchId}`}
          className="shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-white/70 transition-colors duration-150 hover:bg-white/[0.08]"
        >
          Fix
        </Link>
      )}
    </div>
  );
}

export default async function BranchQualityPage() {
  const branches = await getAllBranches();
  const report = validateBranches(branches);
  const allIssues = [...report.errors, ...report.warnings];

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 md:px-8 md:py-10">
      <Link href="/builder" className="flex items-center gap-1.5 text-xs font-semibold text-white/40 hover:text-white/70">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to builder
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-white">Branch Quality</h1>
      <p className="mt-1 text-sm text-white/50">
        Runs automatically on every seed. Duplicate ids/titles, orphans, dead branches, broken
        transitions, self-loops, impossible transitions, and missing required fields.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-white/45">Total branches</p>
          <p className="mt-2 text-2xl font-semibold text-white">{report.totalBranches}</p>
        </div>
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-rose-300/70">Errors</p>
          <p className="mt-2 text-2xl font-semibold text-rose-300">{report.errors.length}</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-300/70">Warnings</p>
          <p className="mt-2 text-2xl font-semibold text-amber-300">{report.warnings.length}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-white/45">Valid branches</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {report.totalBranches - new Set(allIssues.map((i) => i.branchId)).size}
          </p>
        </div>
      </div>

      <div className="mt-8">
        {allIssues.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] py-12 text-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            <p className="text-sm font-semibold text-emerald-200">No issues found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {allIssues.map((issue, i) => (
              <IssueRow key={`${issue.code}-${issue.branchId}-${i}`} issue={issue} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
