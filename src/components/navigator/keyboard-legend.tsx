export function KeyboardLegend() {
  const items = [
    { key: "1-9", label: "Pick branch" },
    { key: "B", label: "Back" },
    { key: "N", label: "Note" },
    { key: "E", label: "End call" },
  ];
  return (
    <div className="hidden flex-wrap items-center gap-3 text-[11px] text-white/30 md:flex">
      {items.map((item) => (
        <span key={item.key} className="flex items-center gap-1.5">
          <kbd className="rounded border border-white/15 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-white/50">
            {item.key}
          </kbd>
          {item.label}
        </span>
      ))}
    </div>
  );
}
