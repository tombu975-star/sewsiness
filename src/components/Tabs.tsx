"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

export function Tabs({ tabs, defaultLabel }: { tabs: { label: string; content: React.ReactNode }[]; defaultLabel?: string }) {
  const initialIndex = defaultLabel
    ? Math.max(0, tabs.findIndex((t) => t.label.toLowerCase() === defaultLabel.toLowerCase()))
    : 0;
  const [active, setActive] = useState(initialIndex);
  const tabId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null);

  // Measures the active tab button so the gradient bar underneath it can
  // slide smoothly between tabs, rather than jumping (a static border-b-2
  // per-button can't animate between two different elements at once).
  useLayoutEffect(() => {
    const el = listRef.current?.querySelector<HTMLButtonElement>(`[data-index="${active}"]`);
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [active, tabs.length]);

  useEffect(() => {
    function onResize() {
      const el = listRef.current?.querySelector<HTMLButtonElement>(`[data-index="${active}"]`);
      if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active]);

  function moveFocus(index: number) {
    setActive(index);
    document.getElementById(`${tabId}-tab-${index}`)?.focus();
  }

  return (
    <div>
      <div
        ref={listRef}
        className="relative flex items-center gap-1 border-b border-border mb-5 overflow-x-auto scrollbar-thin"
        role="tablist"
        aria-label="Page sections"
      >
        {tabs.map((t, i) => (
          <button
            key={t.label}
            id={`${tabId}-tab-${i}`}
            data-index={i}
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
            className={`px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors ${
              i === active ? "text-ink" : "text-ink-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
        {indicator && (
          <span
            aria-hidden="true"
            className="absolute bottom-0 h-[2.5px] rounded-full transition-all duration-300 ease-out"
            style={{ left: indicator.left, width: indicator.width, backgroundImage: "var(--grad-brand)" }}
          />
        )}
      </div>
      <div key={active} id={`${tabId}-panel-${active}`} role="tabpanel" aria-labelledby={`${tabId}-tab-${active}`} tabIndex={0} className="animate-fade-up">
        {tabs[active].content}
      </div>
    </div>
  );
}
