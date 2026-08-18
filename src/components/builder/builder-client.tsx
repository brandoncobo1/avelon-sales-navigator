"use client";

import { useState } from "react";
import type { Branch, BranchInput } from "@/lib/types";
import { BranchList } from "@/components/builder/branch-list";
import { BranchEditorForm } from "@/components/builder/branch-editor-form";

export function BuilderClient({ initialBranches }: { initialBranches: Branch[] }) {
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [selectedId, setSelectedId] = useState<string | null>(initialBranches[0]?.id ?? null);
  const [creatingNew, setCreatingNew] = useState(false);

  const selected = creatingNew ? null : branches.find((b) => b.id === selectedId) ?? null;

  async function handleSave(id: string | null, data: BranchInput) {
    if (id) {
      const res = await fetch(`/api/branches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const { branch } = await res.json();
        setBranches((bs) => bs.map((b) => (b.id === id ? branch : b)));
      }
    } else {
      const res = await fetch(`/api/branches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const { branch } = await res.json();
        setBranches((bs) => [...bs, branch]);
        setSelectedId(branch.id);
        setCreatingNew(false);
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this branch? Any branch pointing to it will be updated.")) return;
    const res = await fetch(`/api/branches/${id}`, { method: "DELETE" });
    if (res.ok) {
      setBranches((bs) => bs.filter((b) => b.id !== id));
      setSelectedId(null);
    }
  }

  async function handleDuplicate(id: string) {
    const res = await fetch(`/api/branches/${id}/duplicate`, { method: "POST" });
    if (res.ok) {
      const { branch } = await res.json();
      setBranches((bs) => [...bs, branch]);
      setSelectedId(branch.id);
      setCreatingNew(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-1px)] flex-col md:flex-row">
      <div className="h-72 shrink-0 border-b border-white/10 md:h-auto md:w-72 md:border-b-0 md:border-r">
        <BranchList
          branches={branches}
          selectedId={creatingNew ? null : selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            setCreatingNew(false);
          }}
          onCreate={() => setCreatingNew(true)}
        />
      </div>
      <div className="min-h-0 flex-1">
        {selected || creatingNew ? (
          <BranchEditorForm
            key={creatingNew ? "new" : selected!.id}
            branch={selected}
            allBranches={branches}
            onSave={handleSave}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/40">
            Select a branch to edit, or create a new one.
          </div>
        )}
      </div>
    </div>
  );
}
