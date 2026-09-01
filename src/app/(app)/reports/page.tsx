import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { requirePageRole } from "@/lib/auth/require-role";

export default async function ReportsPage() {
  await requirePageRole(["owner", "manager"]);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();
  const orgId = profile?.organization_id ?? "";

  const [{ data: orders }, { data: payments }, { data: expenses }, { data: sales }] = await Promise.all([
    supabase.from("custom_orders").select("total_amount, amount_paid, status, created_at").eq("organization_id", orgId),
    supabase.from("payments").select("amount, type, created_at").eq("organization_id", orgId),
    supabase.from("expenses").select("amount, category, created_at").eq("organization_id", orgId),
    supabase.from("pos_sales").select("total, created_at").eq("organization_id", orgId),
  ]);

  const orderRevenue = (orders ?? []).reduce((s, o: any) => s + Number(o.amount_paid), 0);
  const posRevenue = (sales ?? []).reduce((s, sl: any) => s + Number(sl.total), 0);
  const totalExpenses = (expenses ?? []).reduce((s, e: any) => s + Number(e.amount), 0);
  const netProfit = orderRevenue + posRevenue - totalExpenses;
  const outstanding = (orders ?? []).reduce((s, o: any) => s + (Number(o.total_amount) - Number(o.amount_paid)), 0);

  const expensesByCategory = (expenses ?? []).reduce((acc: Record<string, number>, e: any) => {
    acc[e.category] = (acc[e.category] ?? 0) + Number(e.amount);
    return acc;
  }, {});

  const csvRows = [
    ["Report", "Value"],
    ["Order Revenue Collected", orderRevenue.toFixed(2)],
    ["POS Revenue", posRevenue.toFixed(2)],
    ["Total Expenses", totalExpenses.toFixed(2)],
    ["Net Profit", netProfit.toFixed(2)],
    ["Outstanding Receivables", outstanding.toFixed(2)],
  ];
  const csv = csvRows.map((r) => r.join(",")).join("\n");
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;

  return (
    <div>
      <PageHead
        title="Reports"
        subtitle="Exportable overview across orders, POS, expenses and receivables."
        crumb="Reports"
        actions={
          <a href={csvHref} download="sewiness-report.csv" className="inline-flex items-center gap-1.5 rounded-sm text-sm font-semibold px-4 py-2 border border-border-strong text-ink bg-surface hover:bg-sunken">
            Export CSV
          </a>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatCard label="Order Revenue" value={`₵${orderRevenue.toFixed(2)}`} />
        <StatCard label="POS Revenue" value={`₵${posRevenue.toFixed(2)}`} />
        <StatCard label="Expenses" value={`₵${totalExpenses.toFixed(2)}`} />
        <StatCard label="Net Profit" value={`₵${netProfit.toFixed(2)}`} accent />
        <StatCard label="Outstanding" value={`₵${outstanding.toFixed(2)}`} accent />
      </div>

      <h2 className="font-display text-lg font-semibold text-ink mb-3">Expenses by Category</h2>
      <div className="card divide-y divide-border">
        {Object.keys(expensesByCategory).length === 0 && (
          <div className="p-6 text-center text-sm text-ink-muted">No expenses recorded yet.</div>
        )}
        {Object.entries(expensesByCategory).map(([cat, amt]) => (
          <div key={cat} className="p-3.5 flex items-center justify-between text-sm">
            <span className="text-ink">{cat}</span>
            <span className="font-semibold text-ink">₵{amt.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
