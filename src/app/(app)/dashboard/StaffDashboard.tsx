import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { OrderStatusGlance } from "@/components/dashboard/OrderStatusGlance";

// Staff work the floor, not the books — same order visibility as
// Owner/Manager (RLS-wise every org member can read custom_orders; see
// "org members can read orders" in schema.sql), but this view
// deliberately leaves out revenue and outstanding-balance figures,
// which belong to Owner/Manager's view of the same data, not Staff's.
// What Staff actually need at a glance: what's due soon, and what's
// running low on the shelf.
export async function StaffDashboard({ userId }: { userId: string }) {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, organization_id")
    .eq("id", userId)
    .single();

  const orgId = profile?.organization_id;
  const todayIso = new Date().toISOString().slice(0, 10);
  const weekAheadIso = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);

  const [{ data: orders }, { data: dueSoon }, { data: lowStock }] = await Promise.all([
    supabase
      .from("custom_orders")
      .select("id, order_number, garment, due_date, status, customers(full_name)")
      .eq("organization_id", orgId ?? "")
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("custom_orders")
      .select("id, order_number, garment, due_date, status, customers(full_name)")
      .eq("organization_id", orgId ?? "")
      .not("status", "in", "(Completed,Cancelled)")
      .lte("due_date", weekAheadIso)
      .order("due_date", { ascending: true })
      .limit(6),
    supabase
      .from("products")
      .select("id, name, stock_qty, status")
      .eq("organization_id", orgId ?? "")
      .in("status", ["Low Stock", "Out of Stock"])
      .order("stock_qty", { ascending: true })
      .limit(5),
  ]);

  const statusCounts = {
    pending: (orders ?? []).filter((o: any) => o.status === "Pending").length,
    inProgress: (orders ?? []).filter((o: any) => o.status === "In Progress").length,
    completed: (orders ?? []).filter((o: any) => o.status === "Completed").length,
  };
  const dueTodayCount = (dueSoon ?? []).filter((o: any) => o.due_date === todayIso).length;

  const inProductionCount = (orders ?? []).filter((o: any) => o.status === "In Progress").length;

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div>
      <PageHead
        crumb={`Staff · Today, ${today}`}
        title={`Good day, ${firstName}`}
        subtitle="What's due, what's moving, and what needs restocking."
        actions={
          <>
            <Button href="/pos" variant="outline">
              Open POS
            </Button>
            <Button href="/orders/new">+ New Custom Order</Button>
          </>
        }
      />

      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">What would you like to do?</h2>
            <p className="text-xs text-ink-muted mt-0.5">Start common tasks without searching through menus.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/orders/new", icon: "+", label: "New Order", hint: "Create an order" },
            { href: "/customers/new", icon: "\u2609", label: "Customer", hint: "Add a customer" },
            { href: "/measurements/new", icon: "\u25AD", label: "Measurements", hint: "Take measurements" },
            { href: "/production", icon: "\u2699", label: "Production", hint: "Update production stage" },
          ].map((action) => (
            <a
              key={action.href}
              href={action.href}
              className="card p-4 hover:-translate-y-0.5 hover:border-gold/60 transition-all active:scale-[0.99]"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-soft text-indigo2 flex items-center justify-center text-lg font-bold mb-3">
                {action.icon}
              </div>
              <div className="font-semibold text-sm text-ink">{action.label}</div>
              <div className="text-xs text-ink-muted mt-0.5">{action.hint}</div>
            </a>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard label="Orders" value={(orders ?? []).length} icon="✂" />
        <StatCard label="Due Today" value={dueTodayCount} accent icon="◔" />
        <StatCard label="In Production" value={inProductionCount} icon="⚙" />
        <StatCard label="Low / Out of Stock" value={(lowStock ?? []).length} icon="⚠" />
      </div>

      <OrderStatusGlance pending={statusCounts.pending} inProgress={statusCounts.inProgress} completed={statusCounts.completed} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold text-ink">Due This Week</h2>
            <a href="/orders" className="text-sm font-semibold text-indigo inline-flex items-center gap-1 hover:gap-1.5 transition-all">
              View all orders <span aria-hidden="true">→</span>
            </a>
          </div>
          <DataTable
            columns={[
              { key: "order", label: "Order" },
              { key: "customer", label: "Customer" },
              { key: "garment", label: "Garment" },
              { key: "due", label: "Due" },
              { key: "status", label: "Status", isStatus: true },
            ]}
            rows={(dueSoon ?? []).map((o: any) => ({
              id: o.id,
              href: `/orders/${o.id}`,
              cells: {
                order: <span className="font-mono text-xs">{o.order_number}</span>,
                customer: o.customers?.full_name ?? "—",
                garment: o.garment,
                due: o.due_date ?? "—",
                status: o.status,
              },
            }))}
            emptyLabel="Nothing due in the next 7 days."
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold text-ink">Needs Restocking</h2>
          </div>
          <div className="card divide-y divide-border">
            {(lowStock ?? []).length === 0 && (
              <div className="p-6 text-center text-sm text-ink-muted">Everything's well-stocked.</div>
            )}
            {(lowStock ?? []).map((p: any) => (
              <div key={p.id} className="p-3.5 flex items-center justify-between text-sm">
                <div className="font-medium text-ink truncate pr-2">{p.name}</div>
                <div className={`font-mono text-xs font-semibold ${p.status === "Out of Stock" ? "text-danger" : "text-warning"}`}>
                  {p.status === "Out of Stock" ? "Out of stock" : `${p.stock_qty} left`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
