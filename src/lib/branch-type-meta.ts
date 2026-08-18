import {
  MessageSquare,
  HelpCircle,
  ShieldAlert,
  Search,
  PhoneForwarded,
  PhoneCall,
  DoorOpen,
  Trophy,
  StickyNote,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import type { BranchType } from "@/lib/types";

interface BranchTypeMeta {
  label: string;
  icon: LucideIcon;
  badgeClass: string;
  dotClass: string;
}

export const BRANCH_TYPE_META: Record<BranchType, BranchTypeMeta> = {
  SCRIPT: {
    label: "Script",
    icon: MessageSquare,
    badgeClass: "bg-slate-500/15 text-slate-300 border-slate-500/25",
    dotClass: "bg-slate-400",
  },
  QUESTION: {
    label: "Ask this",
    icon: HelpCircle,
    badgeClass: "bg-sky-500/15 text-sky-300 border-sky-500/25",
    dotClass: "bg-sky-400",
  },
  OBJECTION: {
    label: "Handle this",
    icon: ShieldAlert,
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/25",
    dotClass: "bg-amber-400",
  },
  DISCOVERY: {
    label: "Discovery",
    icon: Search,
    badgeClass: "bg-teal-500/15 text-teal-300 border-teal-500/25",
    dotClass: "bg-teal-400",
  },
  TRANSFER: {
    label: "Transfer",
    icon: PhoneForwarded,
    badgeClass: "bg-indigo-500/15 text-indigo-300 border-indigo-500/25",
    dotClass: "bg-indigo-400",
  },
  CALLBACK: {
    label: "Callback",
    icon: PhoneCall,
    badgeClass: "bg-purple-500/15 text-purple-300 border-purple-500/25",
    dotClass: "bg-purple-400",
  },
  EXIT: {
    label: "Exit",
    icon: DoorOpen,
    badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/25",
    dotClass: "bg-rose-400",
  },
  SUCCESS: {
    label: "Objective achieved",
    icon: Trophy,
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
    dotClass: "bg-emerald-400",
  },
  NOTE: {
    label: "Note",
    icon: StickyNote,
    badgeClass: "bg-zinc-500/15 text-zinc-300 border-zinc-500/25",
    dotClass: "bg-zinc-400",
  },
  DECISION_MAKER: {
    label: "Get decision-maker",
    icon: UserCog,
    badgeClass: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/25",
    dotClass: "bg-fuchsia-400",
  },
};
