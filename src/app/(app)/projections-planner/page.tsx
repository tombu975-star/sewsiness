"use client";

import { useState } from "react";
import { PageHead } from "@/components/PageHead";

export default function ProjectionsPlannerPage() {
  const [target, setTarget] = useState(10000);
  const [current, setCurrent] = useState(0);
  const [weeks, setWeeks] = useState(12);

  const gap = Math.max(0, target - current);
  const perWeek = weeks > 0 ? gap / weeks : 0;

  return (
    <div>
      <PageHead title="Make-It-Happen Planner" subtitle="Reverse-engineer a revenue goal into weekly actions." crumb="Projections / Planner" />
      <div className="card p-6 max-w-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Revenue goal (₵)</label>
          <input type="number" value={target} onChange={(e) => setTarget(Number(e.target.value))} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Already have (₵)</label>
          <input type="number" value={current} onChange={(e) => setCurrent(Number(e.target.value))} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Timeframe (weeks)</label>
          <input type="number" value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} className="w-full sm:w-40 rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
        </div>
        <div className="border-t border-border pt-4">
          <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">You need to earn</div>
          <div className="text-3xl font-display font-semibold text-indigo">₵{perWeek.toFixed(2)} <span className="text-base text-ink-muted font-sans font-normal">/ week</span></div>
          <p className="text-xs text-ink-faint mt-2">
            That's roughly {Math.ceil(perWeek / 6)} orders a week at an average order value of ₵600, or {Math.ceil(perWeek / 150)} POS sales a week at an average sale of ₵150.
          </p>
        </div>
      </div>
    </div>
  );
}
