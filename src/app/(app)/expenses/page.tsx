import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";

export default async function ExpensesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("id, category, amount, method, notes, created_at")
    .eq("organization_id", profile?.organization_id ?? "")
    .order("created_at", { ascending: false });

  const rows = (expenses ?? []) as any[];
  const total = rows.reduce((s, e) => s + Number(e.amount), 0);
  const thisMonth = rows
    .filter((e) => new Date(e.created_at).getMonth() === new Date().getMonth())
    .reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div>
      <PageHead title="Expenses" subtitle={`${rows.length} recorded · operating costs by category, branch and payment method`} crumb="Expenses" actions={<Button href="/expenses/new">+ New Expense</Button>} />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="This Month" value={`₵${thisMonth.toFixed(2)}`} accent />
        <StatCard label="All Time" value={`₵${total.toFixed(2)}`} />
        <StatCard label="Entries" value={rows.length} />
      </div>
      {rows.length === 0 ? (
        <EmptyState icon="◈" title="No expenses recorded yet." description="Log operating expenses here to see them reflected in Reports and Business Health." actionLabel="New Expense" actionHref="/expenses/new" />
      ) : (
        <DataTable
          columns={[{ key: "category", label: "Category" }, { key: "amount", label: "Amount" }, { key: "method", label: "Method" }, { key: "date", label: "Date" }]}
          rows={rows.map((e) => ({ id: e.id, cells: { category: e.category, amount: `₵${Number(e.amount).toFixed(2)}`, method: e.method, date: new Date(e.created_at).toLocaleDateString() } }))}
        />
      )}
    </div>
  );
}
