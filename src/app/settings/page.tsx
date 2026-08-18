import { RotateCcw, Keyboard, Bot, User } from "lucide-react";
import { resetConversationScriptAction } from "@/app/actions";

const SHORTCUTS = [
  { key: "1 – 9", label: "Select the corresponding branch" },
  { key: "B", label: "Back to the previous branch" },
  { key: "N", label: "Add a note" },
  { key: "E", label: "End call / open outcome" },
  { key: "Esc", label: "Close any open modal" },
];

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8 md:px-8 md:py-10">
      <h1 className="text-2xl font-semibold text-white">Settings</h1>
      <p className="mt-1 text-sm text-white/50">V1 is single-user — multi-user accounts can be added later.</p>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <User className="h-4 w-4 text-white/40" />
          Rep profile
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-bold text-indigo-300">
            I
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Isse</p>
            <p className="text-xs text-white/40">Sales rep — dental clinics, UK</p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Keyboard className="h-4 w-4 text-white/40" />
          Keyboard shortcuts
        </div>
        <div className="mt-3 space-y-2">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="flex items-center gap-3 text-sm">
              <kbd className="rounded border border-white/15 bg-white/[0.05] px-2 py-1 font-mono text-xs text-white/60">
                {s.key}
              </kbd>
              <span className="text-white/60">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Bot className="h-4 w-4 text-white/40" />
          AI branch suggestions
        </div>
        <p className="mt-2 text-sm text-white/50">
          Live-transcript AI suggestions are architected but not enabled in V1 — branch selection
          is always manual. When enabled, suggestions will always require your confirmation before
          the app moves to a new branch.
        </p>
        <span className="mt-3 inline-block rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-white/40">
          Coming soon
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <RotateCcw className="h-4 w-4 text-white/40" />
          Conversation script
        </div>
        <p className="mt-2 text-sm text-white/50">
          Re-seed the built-in receptionist script. This restores any built-in branch you&apos;ve
          edited or deleted back to its original wording — custom branches you&apos;ve added are left
          untouched.
        </p>
        <form action={resetConversationScriptAction} className="mt-3">
          <button
            type="submit"
            className="cursor-pointer rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/80 transition-colors duration-150 hover:bg-white/[0.08]"
          >
            Reset built-in script
          </button>
        </form>
      </div>
    </div>
  );
}
