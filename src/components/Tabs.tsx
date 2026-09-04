"use client";

import { useState } from "react";

export function Tabs({ tabs, defaultLabel }: { tabs: { label: string; content: React.ReactNode }[]; defaultLabel?: string }) {
  const initialIndex = defaultLabel
    ? Math.max(0, tabs.findIndex((t) => t.label.toLowerCase() === defaultLabel.toLowerCase()))
    : 0;
  const [active, setActive] = useState(initialIndex);
  return (
    <div>
      <div className="flex items-center gap-1 border-b border-border mb-5 overflow-x-auto scrollbar-thin">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            onClick={() => setActive(i)}
            className={`px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
              i === active ? "border-gold text-ink" : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div>{tabs[active].content}</div>
    </div>
  );
}
