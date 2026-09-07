"use client";

import { useState } from "react";
import { PageHead } from "@/components/PageHead";

export function PlannerClient() {
  const [target, setTarget] = useState(10000);
  const [current, setCurrent] = useState(0);
  const [weeks, setWeeks] = useState(12);
  const [submitted, setSubmitted] = useState({ target: 10000, current: 0, weeks: 12 });
  const [error, setError] = useState("");

  const gap = Math.max(0, submitted.target - submitted.current);
  const perWeek = submitted.weeks > 0 ? gap / submitted.weeks : 0;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (target <= 0 || current < 0 || weeks <= 0) {
      setError("Enter a goal above zero, current revenue of zero or more, and a timeframe above zero.");
      return;
    }

    if (current > target) {
      setError("Already-have revenue cannot be greater than the revenue goal.");
      return;
    }

    setError("");
    setSubmitted({ target, current, weeks });
  }

  return (
    <div>
      <PageHead title="Make-It-Happen Planner" subtitle="Reverse-engineer a revenue goal into weekly actions." crumb="Projections / Planner" />
      <form onSubmit={handleSubmit} className="card p-6 max-w-xl space-y-4" noValidate>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Revenue goal (₵)</label>
          <input type="number" min="1" step="0.01" value={target} onChange={(e) => setTarget(Number(e.target.value))} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" aria-describedby={error ? "planner-error" : undefined} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Already have (₵)</label>
          <input type="number" min="0" step="0.01" value={current} onChange={(e) => setCurrent(Number(e.target.value))} className="w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" aria-describedby={error ? "planner-error" : undefined} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-muted mb-1.5">Timeframe (weeks)</label>
          <input type="number" min="1" step="1" value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} className="w-full sm:w-40 rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" aria-describedby={error ? "planner-error" : undefined} />
        </div>
        {error && <p id="planner-error" className="text-sm text-burgundy" role="alert">{error}</p>}
        <button type="submit" className="rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-[#3a2400] transition hover:brightness-[1.03]">Calculate plan</button>
        <div className="border-t border-border pt-4">
          <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">You need to earn</div>
          <div className="text-3xl font-display font-semibold text-indigo" aria-live="polite">₵{perWeek.toFixed(2)} <span className="text-base text-ink-muted font-sans font-normal">/ week</span></div>
          <p className="text-xs text-ink-faint mt-2">
            That&apos;s roughly {Math.ceil(perWeek / 6)} orders a week at an average order value of ₵600, or {Math.ceil(perWeek / 150)} POS sales a week at an average sale of ₵150.
          </p>
        </div>
      </form>
    </div>
  );
}
