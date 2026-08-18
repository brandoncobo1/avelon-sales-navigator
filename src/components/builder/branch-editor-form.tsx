"use client";

import { useMemo, useState } from "react";
import { Trash2, Copy, Save, Eye, EyeOff, Loader2 } from "lucide-react";
import type { Branch, BranchInput, BranchType, Speaker } from "@/lib/types";
import { BRANCH_TYPES } from "@/lib/types";
import { ResponseCard } from "@/components/navigator/response-card";

const SPEAKERS: Speaker[] = ["receptionist", "decision_maker", "rep", "system"];

function toFormState(branch: Branch | null): BranchInput {
  if (branch) return branch;
  return {
    title: "",
    speaker: "receptionist",
    type: "SCRIPT",
    stage: "custom",
    trigger: "",
    responseText: "",
    responseAlt: null,
    objective: "",
    notes: null,
    warning: null,
    tags: [],
    nextBranchIds: [],
    previousBranchId: null,
    order: 0,
    isRoot: false,
  };
}

export function BranchEditorForm({
  branch,
  allBranches,
  onSave,
  onDelete,
  onDuplicate,
}: {
  branch: Branch | null;
  allBranches: Branch[];
  onSave: (id: string | null, data: BranchInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<void>;
}) {
  const [form, setForm] = useState<BranchInput>(() => toFormState(branch));
  const [tagsText, setTagsText] = useState(() => (branch ? branch.tags.join(", ") : ""));
  const [nextSearch, setNextSearch] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [saving, setSaving] = useState(false);

  const candidateNextBranches = useMemo(() => {
    const q = nextSearch.trim().toLowerCase();
    return allBranches
      .filter((b) => b.id !== branch?.id)
      .filter((b) => !q || b.title.toLowerCase().includes(q) || b.id.includes(q));
  }, [allBranches, nextSearch, branch]);

  function update<K extends keyof BranchInput>(key: K, value: BranchInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleNextBranch(id: string) {
    setForm((f) => ({
      ...f,
      nextBranchIds: f.nextBranchIds.includes(id)
        ? f.nextBranchIds.filter((n) => n !== id)
        : [...f.nextBranchIds, id],
    }));
  }

  async function handleSave() {
    setSaving(true);
    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    await onSave(branch?.id ?? null, { ...form, tags });
    setSaving(false);
  }

  const previewBranch: Branch = {
    id: branch?.id ?? "preview",
    ...form,
    createdAt: branch?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <p className="text-sm font-semibold text-white">
          {branch ? "Edit branch" : "New branch"}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/[0.08]"
          >
            {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {showPreview ? "Hide preview" : "Preview"}
          </button>
          {branch && (
            <>
              <button
                type="button"
                onClick={() => onDuplicate(branch.id)}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/[0.08]"
              >
                <Copy className="h-3.5 w-3.5" />
                Duplicate
              </button>
              <button
                type="button"
                onClick={() => onDelete(branch.id)}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </>
          )}
          <button
            type="button"
            disabled={saving || !form.title || !form.responseText}
            onClick={handleSave}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save
          </button>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-0 overflow-hidden xl:grid-cols-2">
        <div className="overflow-y-auto p-4">
          <div className="space-y-4">
            <Field label="Title">
              <input
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                className="input"
                placeholder="They dislike it"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Type">
                <select
                  value={form.type}
                  onChange={(e) => update("type", e.target.value as BranchType)}
                  className="input"
                >
                  {BRANCH_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Speaker">
                <select
                  value={form.speaker}
                  onChange={(e) => update("speaker", e.target.value as Speaker)}
                  className="input"
                >
                  {SPEAKERS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Stage (grouping)">
              <input
                value={form.stage}
                onChange={(e) => update("stage", e.target.value)}
                className="input"
                placeholder="receptionist-software"
              />
            </Field>

            <Field label="Trigger — when to pick this branch">
              <textarea
                value={form.trigger}
                onChange={(e) => update("trigger", e.target.value)}
                rows={2}
                className="input"
                placeholder="They say they dislike their current software"
              />
            </Field>

            <Field label="Say — the response">
              <textarea
                value={form.responseText}
                onChange={(e) => update("responseText", e.target.value)}
                rows={2}
                className="input"
                placeholder="Oh really? What's the main thing you don't like?"
              />
            </Field>

            <Field label="Alternative phrasing (optional)">
              <textarea
                value={form.responseAlt ?? ""}
                onChange={(e) => update("responseAlt", e.target.value || null)}
                rows={2}
                className="input"
              />
            </Field>

            <Field label="Objective">
              <textarea
                value={form.objective}
                onChange={(e) => update("objective", e.target.value)}
                rows={2}
                className="input"
                placeholder="Identify the specific weakness"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Notes (optional)">
                <textarea
                  value={form.notes ?? ""}
                  onChange={(e) => update("notes", e.target.value || null)}
                  rows={2}
                  className="input"
                />
              </Field>
              <Field label="Warning (optional)">
                <textarea
                  value={form.warning ?? ""}
                  onChange={(e) => update("warning", e.target.value || null)}
                  rows={2}
                  className="input"
                />
              </Field>
            </div>

            <Field label="Tags (comma separated)">
              <input
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                className="input"
                placeholder="software, pain-discovery"
              />
            </Field>

            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={form.isRoot}
                onChange={(e) => update("isRoot", e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/5 accent-indigo-500"
              />
              This is a root/entry branch
            </label>

            <div>
              <p className="mb-1.5 text-xs font-medium text-white/50">
                Next branches ({form.nextBranchIds.length} selected)
              </p>
              <input
                value={nextSearch}
                onChange={(e) => setNextSearch(e.target.value)}
                placeholder="Search to add..."
                className="input mb-2"
              />
              <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-white/[0.02] p-2">
                {candidateNextBranches.map((b) => (
                  <label
                    key={b.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-white/70 hover:bg-white/[0.05]"
                  >
                    <input
                      type="checkbox"
                      checked={form.nextBranchIds.includes(b.id)}
                      onChange={() => toggleNextBranch(b.id)}
                      className="h-3.5 w-3.5 rounded border-white/20 bg-white/5 accent-indigo-500"
                    />
                    <span className="truncate">{b.title}</span>
                    <span className="ml-auto shrink-0 text-white/30">{b.id}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {showPreview && (
          <div className="hidden overflow-y-auto border-l border-white/10 bg-black/20 p-4 xl:block">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/35">
              Live preview
            </p>
            <ResponseCard branch={previewBranch} pulseKey={0} />
          </div>
        )}
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.04);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: white;
        }
        .input:focus {
          outline: none;
          border-color: #818cf8;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-white/50">{label}</span>
      {children}
    </label>
  );
}
