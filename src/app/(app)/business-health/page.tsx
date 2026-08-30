import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";

function scoreBadge(score: number) {
  if (score >= 80) return { label: "Healthy", cls: "text-success" };
  if (score >= 50) return { label: "Needs Attention", cls: "text-warning" };
  return { label: "At Risk", cls: "text-danger" };
}

export default async function BusinessHealthPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();
  const orgId = profile?.organization_id ?? "";

  const [{ data: orders }, { data: payments }, { data: expenses }, { data: customers }] = await Promise.all([
    supabase.from("custom_orders").select("total_amount, amount_paid, status, due_date").eq("organization_id", orgId),
    supabase.from("payments").select("amount, created_at").eq("organization_id", orgId),
    supabase.from("expenses").select("amount").eq("organization_id", orgId),
    supabase.from("customers").select("status").eq("organization_id", orgId),
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Profit Margin" value={`${profitMargin.toFixed(1)}%`} />
        <StatCard label="Collection Rate" value={`${collectionRate.toFixed(1)}%`} />
        <StatCard label="Overdue Orders" value={overdueOrders} accent={overdueOrders > 0} />
        <StatCard label="Active Customers" value={`${activeCustomers} / ${customerBase}`} />
      </div>
    </div>
  );
}
