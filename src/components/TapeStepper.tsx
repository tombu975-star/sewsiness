export function TapeStepper({
  steps,
  activeIndex,
}: {
  steps: { label: string; sub?: string }[];
  activeIndex: number;
}) {
  const fillPct = steps.length > 1 ? (activeIndex / (steps.length - 1)) * 100 : 0;

  return (
    <div className="tape">
      <div className="tape-ruler">
        <div className="tape-fill" style={{ width: `${fillPct}%` }} />
      </div>
      <div className="tape-stops">
        {steps.map((s, i) => (
          <div
            key={s.label}
            className={`tape-stop ${i < activeIndex ? "done" : ""} ${i === activeIndex ? "now" : ""}`}
          >
            <div className="dot" />
            <div className="lbl">{s.label}</div>
            {s.sub && <div className="sub">{s.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
