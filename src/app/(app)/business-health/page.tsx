import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { DIMENSIONS } from "@/lib/onboarding/sections";
import { completionPercent, type Answers, type DimensionScores } from "@/lib/onboarding/scoring";
import { requirePageRole } from "@/lib/auth/require-role";

function scoreBadge(score: number) {
  if (score >= 80) return { label: "Healthy", cls: "text-success" };
  if (score >= 50) return { label: "Needs Attention", cls: "text-warning" };
  return { label: "At Risk", cls: "text-danger" };
}

function assessmentBandColor(level: string) {
  if (level === "green") return "text-success";
  if (level === "amber") return "text-warning";
  return "text-danger";
}

export default async function BusinessHealthPage() {
  await requirePageRole(["owner", "manager"]);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();
  const orgId = profile?.organization_id ?? "";

  const [{ data: orders }, { data: payments }, { data: expenses }, { data: customers }, { data: assessment }] = await Promise.all([
    supabase.from("custom_orders").select("total_amount, amount_paid, status, due_date").eq("organization_id", orgId),
    supabase.from("payments").select("amount, created_at").eq("organization_id", orgId),
    supabase.from("expenses").select("amount").eq("organization_id", orgId),
    supabase.from("customers").select("status").eq("organization_id", orgId),
    supabase
      .from("onboarding_assessments")
      .select("status, answers, dimension_scores, overall_score, health_band, recommendations, submitted_at")
      .eq("organization_id", orgId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const totalRevenue = (payments ?? []).reduce((s, p: any) => s + Number(p.amount), 0);
  const totalExpenses = (expenses ?? []).reduce((s, e: any) => s + Number(e.amount), 0);
  const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;

  const overdueOrders = (orders ?? []).filter((o: any) => o.due_date && new Date(o.due_date) < new Date() && o.status !== "Completed").length;
  const collectionRate = (orders ?? []).length
    ? ((orders ?? []).reduce((s: number, o: any) => s + Number(o.amount_paid), 0) / Math.max(1, (orders ?? []).reduce((s: number, o: any) => s + Number(o.total_amount), 0))) * 100
    : 100;
  const activeCustomers = (customers ?? []).filter((c: any) => c.status === "Active").length;
  const customerBase = (customers ?? []).length || 1;
  const retentionScore = (activeCustomers / customerBase) * 100;

  const score = Math.round(Math.max(0, Math.min(100, profitMargin * 0.4 + collectionRate * 0.35 + retentionScore * 0.15 + (overdueOrders === 0 ? 10 : 0))));
  const badge = scoreBadge(score);

  return (
    <div>
      <PageHead title="Business Health Check" subtitle="A guided diagnostic of the business's financial and operational health." crumb="Business Health" />

      <div className="card p-8 text-center mb-6">
        <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Overall Score</div>
        <div className={`text-6xl font-display font-bold ${badge.cls}`}>{score}</div>
        <div className={`text-sm font-semibold mt-1 ${badge.cls}`}>{badge.label}</div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Profit Margin" value={`${profitMargin.toFixed(1)}%`} />
        <StatCard label="Collection Rate" value={`${collectionRate.toFixed(1)}%`} />
        <StatCard label="Overdue Orders" value={overdueOrders} accent={overdueOrders > 0} />
        <StatCard label="Active Customers" value={`${activeCustomers} / ${customerBase}`} />
      </div>

      <div className="flex items-end justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h2 className="font-display text-xl font-semibold text-ink">Business Health Assessment</h2>
          <p className="text-[13.5px] text-ink-muted mt-1 max-w-xl">
            A fuller, self-reported picture across compliance, operations, finance, people and sustainability —
            with recommendations for what to fix first.
          </p>
        </div>
        <Button href="/business-health/assessment" variant={assessment ? "outline" : "primary"}>
          {assessment?.status === "submitted" ? "Update assessment" : assessment ? "Continue assessment" : "Start assessment"}
        </Button>
      </div>

      {!assessment ? (
        <EmptyState
          icon="◈"
          title="No assessment yet"
          description="Complete the Business Health Assessment to get a weighted 0–100 score across 7 dimensions and tailored recommendations."
          actionLabel="Start assessment"
          actionHref="/business-health/assessment"
        />
      ) : (
        <div className="card p-6">
          <div className="flex flex-wrap items-center gap-6 mb-6">
            <div className="text-center">
              <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">
                {assessment.status === "submitted" ? "Overall Score" : "Provisional Score"}
              </div>
              <div className={`font-display text-5xl font-bold ${assessmentBandColor(bandLevel(assessment.overall_score ?? 0))}`}>
                {assessment.overall_score ?? 0}
              </div>
              <div className="text-sm font-semibold mt-1">{assessment.health_band ?? "—"}</div>
            </div>
            <div className="flex-1 min-w-[220px]">
              {assessment.status === "draft" && (
                <div className="text-xs text-ink-muted">
                  {completionPercent((assessment.answers as Answers) ?? {})}% complete — finish every section and submit
                  for your confirmed score.
                </div>
              )}
              {assessment.status === "submitted" && assessment.submitted_at && (
                <div className="text-xs text-ink-muted">
                  Submitted {new Date(assessment.submitted_at).toLocaleDateString()}.
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                {DIMENSIONS.filter((d) => d.scored).map((d) => {
                  const s = (assessment.dimension_scores as DimensionScores | null)?.[d.key];
                  return (
                    <div key={d.key} className="rounded-sm border border-border px-2.5 py-2">
                      <div className="text-[10.5px] text-ink-muted uppercase tracking-wide">{d.title}</div>
                      <div className="text-sm font-semibold text-ink">{typeof s === "number" ? s : "—"}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {Array.isArray(assessment.recommendations) && assessment.recommendations.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
                Recommended next steps
              </div>
              <div className="space-y-2">
                {(assessment.recommendations as { dimension: string; dimensionTitle: string; priority: string; action: string }[]).map(
                  (r, i) => (
                    <div key={i} className="rounded-sm bg-sunken p-3 flex items-start gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 mt-0.5 ${
                          r.priority === "high" ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning"
                        }`}
                      >
                        {r.priority}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-ink">{r.dimensionTitle}</div>
                        <div className="text-xs text-ink-muted mt-0.5">{r.action}</div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function bandLevel(score: number): "green" | "amber" | "red" {
  if (score >= 65) return "green";
  if (score >= 50) return "amber";
  return "red";
}
