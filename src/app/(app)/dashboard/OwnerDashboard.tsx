import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { SubmitButton } from "@/components/SubmitButton";
import { OrderStatusGlance } from "@/components/dashboard/OrderStatusGlance";
import { markAdvisoryNoteSeen } from "../admin/actions";
import type { Role } from "@/lib/types";

// The full business-wide view — the only one of the five role
// dashboards that shows real money (revenue, outstanding balance).
// Manager gets exactly the same view as Owner: both roles can write
// everywhere a business operates (see the `roles` arrays on SIDEBAR
// items in nav.ts), so there's no operational boundary between them to
// reflect here, just the "Owner / Madam" vs "Manager" label itself.
export async function OwnerDashboard({ userId, role }: { userId: string; role: Role }) {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, organization_id")
    .eq("id", userId)
    .single();

  const orgId = profile?.organization_id;

  const [
    { count: customerCount },
    { count: orderCount },
    { data: statsOrders },
    { data: recentOrders },
    { data: recentPayments },
    { data: advisoryNotes },
  ] = await Promise.all([
    supabase.from("customers").select("*", { count: "exact", head: true }).eq("organization_id", orgId ?? ""),
    supabase.from("custom_orders").select("*", { count: "exact", head: true }).eq("organization_id", orgId ?? ""),
    // A separate, broader fetch just for the KPI row below — "Due
    // Today"/"In Production"/"Pending Payment" need to be counted across
    // every active order, not just the 6 most recent ones the Recent
    // Orders table shows. 1000 is a generous cap for a business this
    // app is built for; revisit if a shop ever genuinely has more
    // simultaneously-active orders than that. Also doubles as the
    // source for "Needs your attention" below, so it carries enough
    // columns (id, order_number, garment, customer name) to link
    // straight to the order, not just count it.
    supabase
      .from("custom_orders")
      .select("id, order_number, garment, status, due_date, total_amount, amount_paid, customers(full_name)")
      .eq("organization_id", orgId ?? "")
      .not("status", "in", "(Completed,Cancelled)")
      .limit(1000),
    supabase
      .from("custom_orders")
      .select("id, order_number, garment, due_date, status, total_amount, amount_paid, customers(full_name)")
      .eq("organization_id", orgId ?? "")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("payments")
      .select("id, amount, method, type, created_at")
      .eq("organization_id", orgId ?? "")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("advisory_notes")
      .select("id, message, created_at")
      .eq("organization_id", orgId ?? "")
      .is("seen_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const todayIso = new Date().toISOString().slice(0, 10);
  const activeOrders = (statsOrders ?? []) as any[];
  const dueTodayCount = activeOrders.filter((o) => o.due_date === todayIso).length;
  const inProductionCount = activeOrders.filter((o) => o.status === "In Progress").length;
  const pendingPaymentCount = activeOrders.filter((o) => Number(o.amount_paid) < Number(o.total_amount)).length;

  // Outstanding balance has to be summed from the same broad, org-wide
  // fetch the KPI counts above use (statsOrders) — not from recentOrders,
  // which is capped to the 6 most recent orders and would silently
  // understate this the moment an org has more than 6 active orders.
  const totalOutstanding = activeOrders.reduce(
    (sum: number, o: any) => sum + Math.max(0, Number(o.total_amount) - Number(o.amount_paid)),
    0
  );

  // "Needs your attention" — overdue first (already active but past its
  // due date, regardless of what status it's sitting in — mirrors how
  // receivables/page.tsx computes overdue, since there's no automatic
  // job that flips an order's status to "Overdue" on its own), then due
  // today, then the largest outstanding balances. Deduped and capped
  // short on purpose: this is meant to answer "what should I actually
  // do right now", not become a second orders table.
  const attentionMap = new Map<string, any>();
  activeOrders
    .filter((o) => o.due_date && o.due_date < todayIso)
    .forEach((o) => attentionMap.set(o.id, { ...o, reason: "overdue" as const }));
  activeOrders
    .filter((o) => o.due_date === todayIso)
    .forEach((o) => {
      if (!attentionMap.has(o.id)) attentionMap.set(o.id, { ...o, reason: "due-today" as const });
    });
  [...activeOrders]
    .map((o) => ({ ...o, balance: Number(o.total_amount) - Number(o.amount_paid) }))
    .filter((o) => o.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .forEach((o) => {
      if (!attentionMap.has(o.id)) attentionMap.set(o.id, { ...o, reason: "payment-due" as const });
    });
  const attention = [...attentionMap.values()].slice(0, 5);
  const revenueToday = (recentPayments ?? [])
    .filter((p: any) => new Date(p.created_at).toDateString() === new Date().toDateString())
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  const statusCounts = {
    pending: (recentOrders ?? []).filter((o: any) => o.status === "Pending").length,
    inProgress: (recentOrders ?? []).filter((o: any) => o.status === "In Progress").length,
    completed: (recentOrders ?? []).filter((o: any) => o.status === "Completed").length,
  };

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const roleLabel = role === "manager" ? "Manager" : "Owner";

  return (
    <div>
      {((advisoryNotes ?? []) as { id: string; message: string; created_at: string }[]).map((note) => (
        <div key={note.id} className="callout flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide mb-0.5">Note from Sewsiness</div>
            <p>{note.message}</p>
          </div>
          <form action={markAdvisoryNoteSeen} className="shrink-0">
            <input type="hidden" name="note_id" value={note.id} />
            <SubmitButton variant="outline" pendingLabel="…" className="!py-1.5 !px-3 text-xs">
              Dismiss
            </SubmitButton>
          </form>
        </div>
      ))}

      <PageHead
        crumb={`${roleLabel} · Today, ${today}`}
        title={`Good day, ${firstName}`}
        subtitle="Here's what's moving across your atelier today."
        actions={
          <>
            <Button href="/pos" variant="outline">
              Open POS
            </Button>
            <Button href="/orders/new">+ New Custom Order</Button>
          </>
        }
      />

      {attention.length > 0 && (
        <div className="card p-4 mb-5" style={{ borderColor: "var(--warning-soft)" }}>
          <h3 className="font-display text-[14px] font-semibold text-ink mb-1">Needs your attention</h3>
          <p className="text-[11.5px] text-ink-muted mb-2.5">Overdue, due today, or still owing a balance.</p>
          <div className="divide-y divide-border -mx-1">
            {attention.map((o: any) => {
              const balance = Number(o.total_amount) - Number(o.amount_paid);
              return (
                <a
                  key={o.id}
                  href={`/orders/${o.id}`}
                  className="flex items-center justify-between gap-3 px-1 py-2.5 hover:bg-sunken rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: o.reason === "overdue" ? "var(--danger)" : "var(--warning)" }}
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-ink truncate">
                        {o.customers?.full_name ?? "—"} · {o.garment}
                      </div>
                      <div className="text-[11.5px] text-ink-muted">
                        {o.reason === "overdue" && `Overdue since ${o.due_date}`}
                        {o.reason === "due-today" && "Due today"}
                        {o.reason === "payment-due" && `₵${balance.toFixed(2)} outstanding`}
                      </div>
                    </div>
                  </div>
                  <span className="text-ink-faint text-xs flex-shrink-0">→</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

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
            { href: "/payments", icon: "\u25C9", label: "Payment", hint: "Record or view payments" },
          ].map((action) => (
            <a key={action.href} href={action.href} className="card p-4 hover:-translate-y-0.5 hover:border-gold/60 transition-all active:scale-[0.99]">
              <div className="w-10 h-10 rounded-xl bg-indigo-soft text-indigo2 flex items-center justify-center text-lg font-bold mb-3">{action.icon}</div>
              <div className="font-semibold text-sm text-ink">{action.label}</div>
              <div className="text-xs text-ink-muted mt-0.5">{action.hint}</div>
            </a>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <StatCard label="Orders" value={orderCount ?? 0} icon="✂" />
        <StatCard label="Due Today" value={dueTodayCount} accent icon="◔" />
        <StatCard label="In Production" value={inProductionCount} icon="⚙" />
        <StatCard label="Pending Payment" value={pendingPaymentCount} accent icon="◉" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard label="Customers" value={customerCount ?? 0} icon="☺" />
        <StatCard label="Revenue Today" value={`₵${revenueToday.toFixed(2)}`} icon="◈" />
        <StatCard label="Outstanding Balance" value={`₵${totalOutstanding.toFixed(2)}`} icon="◉" />
      </div>

      <OrderStatusGlance pending={statusCounts.pending} inProgress={statusCounts.inProgress} completed={statusCounts.completed} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold text-ink">Recent Orders</h2>
            <a href="/orders" className="text-sm font-semibold text-indigo inline-flex items-center gap-1 hover:gap-1.5 transition-all">
              View all <span aria-hidden="true">→</span>
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
            rows={(recentOrders ?? []).map((o: any) => ({
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
            emptyLabel="No orders yet. Create your first custom order to get started."
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold text-ink">Recent Payments</h2>
            <a href="/payments" className="text-sm font-semibold text-indigo inline-flex items-center gap-1 hover:gap-1.5 transition-all">
              View all <span aria-hidden="true">→</span>
            </a>
          </div>
          <div className="card divide-y divide-border">
            {(recentPayments ?? []).length === 0 && (
              <div className="p-6 text-center text-sm text-ink-muted">No payments recorded yet.</div>
            )}
            {(recentPayments ?? []).map((p: any) => (
              <div key={p.id} className="p-3.5 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium text-ink">{p.type}</div>
                  <div className="text-xs text-ink-muted">{p.method}</div>
                </div>
                <div className="font-mono font-semibold text-ink">₵{Number(p.amount).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
