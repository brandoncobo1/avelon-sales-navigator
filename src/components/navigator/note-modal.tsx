"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function NoteModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (text: string) => void;
}) {
  const [text, setText] = useState("");

  function handleSave() {
    if (!text.trim()) return;
    onSave(text.trim());
    setText("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 md:items-center">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12141a] p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Add note</p>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-white/40 hover:text-white/80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Add what they told you..."
          className="mt-3 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-indigo-400 focus:outline-none"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-white/70 hover:bg-white/[0.05]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="cursor-pointer rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
          >
            Save note
          </button>
        </div>
      </div>
    </div>
  );
}
