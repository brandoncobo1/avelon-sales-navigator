import { OctagonAlert } from "lucide-react";

export function DoNotPitchBanner({ recommendedQuestion }: { recommendedQuestion: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/[0.08] px-4 py-3">
      <OctagonAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-rose-300">Do not pitch yet</p>
        <p className="mt-1 text-sm text-rose-200/90">
          Pain isn&apos;t established. Ask: <span className="font-semibold">&ldquo;{recommendedQuestion}&rdquo;</span>
        </p>
      </div>
    </div>
  );
}
