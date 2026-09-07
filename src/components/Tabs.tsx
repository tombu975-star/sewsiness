"use client";

import { useId, useState } from "react";

export function Tabs({ tabs, defaultLabel }: { tabs: { label: string; content: React.ReactNode }[]; defaultLabel?: string }) {
  const initialIndex = defaultLabel
    ? Math.max(0, tabs.findIndex((t) => t.label.toLowerCase() === defaultLabel.toLowerCase()))
    : 0;
  const [active, setActive] = useState(initialIndex);
  const tabId = useId();

  function moveFocus(index: number) {
    setActive(index);
    document.getElementById(`${tabId}-tab-${index}`)?.focus();
  }

  return (
    <div>
      <div className="flex items-center gap-1 border-b border-border mb-5 overflow-x-auto scrollbar-thin" role="tablist" aria-label="Page sections">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            id={`${tabId}-tab-${i}`}
            role="tab"
            aria-selected={i === active}
            aria-controls={`${tabId}-panel-${i}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") moveFocus((i + 1) % tabs.length);
              if (event.key === "ArrowLeft") moveFocus((i - 1 + tabs.length) % tabs.length);
              if (event.key === "Home") moveFocus(0);
              if (event.key === "End") moveFocus(tabs.length - 1);
            }}
            className={`px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
              i === active ? "border-gold text-ink" : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div id={`${tabId}-panel-${active}`} role="tabpanel" aria-labelledby={`${tabId}-tab-${active}`} tabIndex={0}>
        {tabs[active].content}
      </div>
    </div>
  );
}
