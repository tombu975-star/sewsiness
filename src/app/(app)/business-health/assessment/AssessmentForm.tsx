"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { DIMENSIONS, type Dimension } from "@/lib/onboarding/sections";
import { completionPercent, type Answers } from "@/lib/onboarding/scoring";
import { SubmitButton } from "@/components/SubmitButton";
import { Button } from "@/components/Button";
import { initialActionState } from "@/lib/action-state";
import { saveAssessmentSection, submitAssessment } from "./actions";

function DimensionSection({ dimension, answers }: { dimension: Dimension; answers: Answers[string] | undefined }) {
  const [state, formAction] = useFormState(saveAssessmentSection, initialActionState);
  return (
    <form action={formAction} className="card p-6 space-y-6">
      <input type="hidden" name="dimension_key" value={dimension.key} />
      <div>
        <h3 className="font-display text-lg font-semibold text-ink">{dimension.title}</h3>
        <p className="text-sm text-ink-muted mt-1">{dimension.description}</p>
        {!dimension.scored && (
          <p className="text-[11px] text-ink-faint mt-1">Not part of the 0–100 score — used for recommendations only.</p>
        )}
      </div>

      <div className="space-y-5">
        {dimension.questions.map((q) => (
          <fieldset key={q.key}>
            <legend className="text-sm font-semibold text-ink mb-1">{q.label}</legend>
            {q.helpText && <p className="text-xs text-ink-muted mb-2">{q.helpText}</p>}
            <div className="space-y-1.5 mt-2">
              {q.options.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-2.5 rounded-sm border border-border px-3 py-2 text-sm text-ink cursor-pointer hover:border-gold has-[:checked]:border-gold has-[:checked]:bg-gold-soft"
                >
                  <input
                    type="radio"
                    name={`q_${q.key}`}
                    value={opt.value}
                    defaultChecked={answers?.[q.key] === opt.value}
                    className="accent-current"
                    required
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      {state.error && (
        <div className="rounded-sm bg-danger-soft text-danger text-sm font-medium px-3 py-2" role="alert">
          {state.error}
        </div>
      )}

      <SubmitButton pendingLabel="Saving…">Save this section</SubmitButton>
    </form>
  );
}

export function AssessmentForm({ answers }: { answers: Answers }) {
  const [active, setActive] = useState(0);
  const [submitState, submitFormAction] = useFormState(submitAssessment, initialActionState);
  const percent = completionPercent(answers);
  const activeDimension = DIMENSIONS[active];

  return (
    <div className="grid lg:grid-cols-[220px_1fr] gap-6">
      <nav className="lg:sticky lg:top-4 h-fit">
        <div className="mb-3">
          <div className="flex justify-between text-xs text-ink-muted mb-1.5">
            <span>Progress</span>
            <span>{percent}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-sunken overflow-hidden">
            <div className="h-full bg-gold" style={{ width: `${percent}%` }} />
          </div>
        </div>
        <ul className="space-y-1">
          {DIMENSIONS.map((d, i) => {
            const total = d.questions.length;
            const done = d.questions.filter((q) => answers[d.key]?.[q.key]).length;
            return (
              <li key={d.key}>
                <button
                  type="button"
                  onClick={() => setActive(i)}
                  className={`w-full text-left rounded-sm px-3 py-2 text-sm font-medium flex items-center justify-between gap-2 ${
                    i === active ? "bg-gold-soft text-ink" : "text-ink-muted hover:bg-sunken"
                  }`}
                >
                  <span>{d.title}</span>
                  <span className="text-[11px] text-ink-faint">
                    {done}/{total}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-4">
        <DimensionSection key={activeDimension.key} dimension={activeDimension} answers={answers[activeDimension.key]} />

        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setActive((i) => Math.max(0, i - 1))} disabled={active === 0}>
            Back
          </Button>
          {active < DIMENSIONS.length - 1 ? (
            <Button onClick={() => setActive((i) => Math.min(DIMENSIONS.length - 1, i + 1))}>Next section</Button>
          ) : (
            <form action={submitFormAction}>
              <SubmitButton pendingLabel="Submitting…">Submit assessment</SubmitButton>
            </form>
          )}
        </div>
        {submitState.error && (
          <div className="rounded-sm bg-danger-soft text-danger text-sm font-medium px-3 py-2" role="alert">
            {submitState.error}
          </div>
        )}
      </div>
    </div>
  );
}
