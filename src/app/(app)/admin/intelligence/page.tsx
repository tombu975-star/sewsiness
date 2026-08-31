import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { SCORED_DIMENSIONS } from "@/lib/onboarding/sections";
import { requirePageRole } from "@/lib/auth/require-role";

type MetricRow = {
  organization_id: string;
  business_name: string;
  region: string | null;
  health_score: number | null;
  dimension_scores: Record<string, number> | null;
  growth_delta: number | null;
  trend: string;
  priority: string;
  health_submitted_at: string | null;
};

const PRIORITY_TONE: Record<string, string> = {
  Critical: "bg-danger-soft text-danger",
  Medium: "bg-warning-soft text-warning",
  Low: "bg-success-soft text-success",
  Unknown: "bg-sunken text-ink-muted",
};

const TREND_TONE: Record<string, string> = {
  Improving: "text-success",
  Declining: "text-danger",
  Stable: "text-ink-muted",
  New: "text-info",
  "No assessment": "text-ink-faint",
};

function dimensionTitle(key: string): string {
  return SCORED_DIMENSIONS.find((d) => d.key === key)?.title ?? key;
}

// The lowest-scoring dimension on a business's latest submitted health
// assessment — this is what "Support Area" surfaces, mirroring the
// per-business recommendations already shown to the owner themselves
// (see src/lib/onboarding/scoring.ts).
function primarySupportArea(scores: Record<string, number> | null): string {
  if (!scores || Object.keys(scores).length === 0) return "None";
  let lowestKey: string | null = null;
  let lowestValue = Infinity;
  for (const [key, value] of Object.entries(scores)) {
    if (value < lowestValue) {
      lowestValue = value;
      lowestKey = key;
    }
  }
  if (lowestKey === null || lowestValue >= 65) return "None";
  return dimensionTitle(lowestKey);
}

export default async function PlatformBusinessIntelligencePage() {
  await requirePageRole(["super_admin"]);
  const supabase = createClient();
  const { data, error } = await supabase
    .from("platform_business_metrics")
    .select("*")
    .order("health_score", { ascending: true, nullsFirst: false });

  const rows = (data ?? []) as MetricRow[];
  const withScore = rows.filter((r) => r.health_score !== null);

  const avgHealth = withScore.length
    ? Math.round(withScore.reduce((sum, r) => sum + (r.health_score ?? 0), 0) / withScore.length)
    : 0;
  const avgGrowth =
    withScore.filter((r) => r.growth_delta !== null).length > 0
      ? withScore.reduce((sum, r) => sum + (r.growth_delta ?? 0), 0) /
        Math.max(1, withScore.filter((r) => r.growth_delta !== null).length)
      : 0;
  const needsSupport = rows.filter((r) => r.priority === "Critical" || r.priority === "Medium").length;

  const radar = [
    { label: "Critical", value: rows.filter((r) => r.priority === "Critical").length, tone: "text-danger" },
    { label: "High", value: rows.filter((r) => r.priority === "Medium" && (r.health_score ?? 0) < 58).length, tone: "text-warning" },
    { label: "Medium", value: rows.filter((r) => r.priority === "Medium" && (r.health_score ?? 0) >= 58).length, tone: "text-info" },
    { label: "Low / Healthy", value: rows.filter((r) => r.priority === "Low").length, tone: "text-success" },
  ];

  const supportAreaCounts = new Map<string, number>();
  for (const r of rows) {
    const area = primarySupportArea(r.dimension_scores);
    if (area === "None") continue;
    supportAreaCounts.set(area, (supportAreaCounts.get(area) ?? 0) + 1);
  }
  const supportAreas = [...supportAreaCounts.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <PageHead
        crumb="Platform Owner / Super Admin"
        title="Business Performance Intelligence"
        subtitle="Monitor health, growth and support needs across every verified business — never revenue, invoices or customer records."
      />

      {error && (
        <div className="callout mb-4">
          Couldn&rsquo;t load business intelligence ({error.message}). If this is a fresh database, make
          sure you&rsquo;ve run{" "}
          <code className="font-mono">supabase/migrations/018_platform_business_intelligence.sql</code> in
          the Supabase SQL editor.
        </div>
      )}

      {!error && rows.length === 0 ? (
        <EmptyState
          icon="◈"
          title="No verified businesses yet."
          description="Once a business is verified and has submitted a Business Health Assessment, its health, growth and support needs will show up here."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCard label="Verified Businesses" value={rows.length} />
            <StatCard label="Average Health" value={`${avgHealth}/100`} />
            <StatCard label="Needs Support" value={needsSupport} accent />
            <StatCard label="Average Growth" value={`${avgGrowth > 0 ? "+" : ""}${avgGrowth.toFixed(1)}%`} accent />
          </div>

          <section className="card p-6 mb-5">
            <h2 className="font-display text-lg font-semibold text-ink mb-4">Support Radar</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {radar.map((r) => (
                <div key={r.label} className="rounded-sm bg-sunken p-4">
                  <strong className={`block font-display text-2xl ${r.tone}`}>{r.value}</strong>
                  <div className="text-sm text-ink-muted mt-1">{r.label}</div>
                </div>
              ))}
            </div>
            {supportAreas.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-4">
                {supportAreas.map(([area, count]) => (
                  <div key={area} className="rounded-sm border border-border px-3.5 py-3 text-sm text-ink">
                    {area} — {count} {count === 1 ? "business" : "businesses"}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card p-6 overflow-x-auto scrollbar-thin">
            <h2 className="font-display text-lg font-semibold text-ink mb-1">Business Performance</h2>
            <p className="text-sm text-ink-muted mb-4">Privacy-safe indicators only. No raw tenant source records.</p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left border-b border-border bg-sunken/60">
                  {["Business", "Health", "Growth", "Trend", "Priority", "Support Area"].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 font-mono font-medium text-[10.5px] uppercase tracking-wider text-ink-muted whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.organization_id}>
                    <td className="px-3 py-3 border-b border-border font-medium text-ink whitespace-nowrap">
                      <a href={`/admin/${r.organization_id}`} className="hover:text-indigo hover:underline">
                        {r.business_name}
                      </a>
                    </td>
                    <td className="px-3 py-3 border-b border-border text-ink whitespace-nowrap">
                      {r.health_score !== null ? `${r.health_score}/100` : "—"}
                    </td>
                    <td className="px-3 py-3 border-b border-border text-ink whitespace-nowrap">
                      {r.growth_delta !== null ? `${r.growth_delta > 0 ? "+" : ""}${r.growth_delta}%` : "—"}
                    </td>
                    <td className={`px-3 py-3 border-b border-border whitespace-nowrap ${TREND_TONE[r.trend] ?? "text-ink"}`}>
                      {r.trend}
                    </td>
                    <td className="px-3 py-3 border-b border-border whitespace-nowrap">
                      <span className={`badge ${PRIORITY_TONE[r.priority] ?? "bg-sunken text-ink-muted"}`}>
                        {r.priority}
                      </span>
                    </td>
                    <td className="px-3 py-3 border-b border-border text-ink whitespace-nowrap">
                      {primarySupportArea(r.dimension_scores)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      <section className="card p-6 mt-5">
        <h2 className="font-display text-lg font-semibold text-ink mb-3">Privacy Boundary</h2>
        <ul className="space-y-2.5 text-sm text-ink-soft">
          <li>
            <span className="text-success font-semibold">✓</span> Health, growth, trends and support needs
            are visible.
          </li>
          <li>
            <span className="text-success font-semibold">✓</span> Aggregated workforce and impact indicators
            are visible.
          </li>
          <li>
            <span className="text-danger font-semibold">✕</span> Raw revenue, expenses, customer records and
            detailed transactions are not visible.
          </li>
          <li>
            <span className="text-danger font-semibold">✕</span> Employee salaries, supplier pricing,
            detailed inventory and private documents are not visible.
          </li>
          <li>
            <span className="text-danger font-semibold">✕</span> No default tenant impersonation.
          </li>
          <li>
            <span className="text-success font-semibold">✓</span> Exceptional support access must be scoped,
            time-limited and audited.
          </li>
        </ul>
      </section>
    </div>
  );
}
