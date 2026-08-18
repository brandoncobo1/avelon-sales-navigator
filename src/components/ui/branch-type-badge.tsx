import { BRANCH_TYPE_META } from "@/lib/branch-type-meta";
import type { BranchType } from "@/lib/types";
import { cn } from "@/lib/cn";

export function BranchTypeBadge({ type, className }: { type: BranchType; className?: string }) {
  const meta = BRANCH_TYPE_META[type];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        meta.badgeClass,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  );
}
