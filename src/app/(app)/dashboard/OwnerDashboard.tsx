import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { SubmitButton } from "@/components/SubmitButton";
import { OrderStatusGlance } from "@/components/dashboard/OrderStatusGlance";
import { AdvisoryAlert } from "@/components/dashboard/AdvisoryAlert";
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

  const [{ count: customerCount }, { count: orderCount }, { data: recentOrders }, { data: recentPayments }, { data: advisoryNotes }, { data: trainingTasks }, { count: apprenticeCount }] =
    await Promise.all([
      supabase.from("customers").select("*", { count: "exact", head: true }).eq("organization_id", orgId ?? ""),
      supabase.from("custom_orders").select("*", { count: "exact", head: true }).eq("organization_id", orgId ?? ""),
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
      supabase
        .from("training_tasks")
        .select("id, status")
        .eq("organization_id", orgId ?? ""),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId ?? "")
        .eq("role", "apprentice"),
    ]);

  const totalOutstanding = (recentOrders ?? []).reduce(
    (sum: number, o: any) => sum + (Number(o.total_amount) - Number(o.amount_paid)),
    0
  );
  const revenueToday = (recentPayments ?? [])
    .filter((p: any) => new Date(p.created_at).toDateString() === new Date().toDateString())
    .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

  const statusCounts = {
    newOrders: (recentOrders ?? []).filter((o: any) => o.status === "New").length,
    inProduction: (recentOrders ?? []).filter((o: any) => o.status === "In Production").length,
    delivered: (recentOrders ?? []).filter((o: any) => o.status === "Delivered").length,
  };
  const trainingRows = (trainingTasks ?? []) as { id: string; status: string }[];
  const submittedTraining = trainingRows.filter((task) => task.status === "Submitted").length;
  const approvedTraining = trainingRows.filter((task) => task.status === "Approved").length;

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const roleLabel = role === "manager" ? "Manager" : "Owner";

  return (
    <div>
      <AdvisoryAlert notes={((advisoryNotes ?? []) as { id: string; message: string; created_at: string }[])} />
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
        subtitle="A clear operating view of orders, cash, customers, and workforce development."
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
            { href: "/orders/new", icon: "+", label: "New Order", hint: "Create an order", grad: "var(--grad-brand)" },
            { href: "/customers/new", icon: "👤", label: "Customer", hint: "Add a customer", grad: "var(--grad-teal)" },
            { href: "/measurements/new", icon: "📏", label: "Measurements", hint: "Take measurements", grad: "var(--grad-rose)" },
            { href: "/payments", icon: "₵", label: "Payment", hint: "Record or view payments", grad: "var(--grad-amber)" },
          ].map((action, i) => (
            <a
              key={action.href}
              href={action.href}
              className="card card-glow p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all active:scale-[0.99] animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div
                className="w-10 h-10 rounded-xl text-white flex items-center justify-center text-lg font-bold mb-3"
                style={{ backgroundImage: action.grad }}
              >
                {action.icon}
              </div>
              <div className="font-semibold text-sm text-ink">{action.label}</div>
              <div className="text-xs text-ink-muted mt-0.5">{action.hint}</div>
            </a>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <StatCard label="Customers" value={customerCount ?? 0} icon="☺" tone="blue" index={0} />
        <StatCard label="Active Orders" value={orderCount ?? 0} icon="✂" tone="teal" index={1} />
        <StatCard label="Revenue Today" value={`₵${revenueToday.toFixed(2)}`} accent icon="◈" tone="brand" index={2} />
        <StatCard label="Outstanding Balance" value={`₵${totalOutstanding.toFixed(2)}`} accent icon="◉" tone="rose" index={3} />
        <StatCard label="Apprentices" value={apprenticeCount ?? 0} icon="◎" tone="amber" index={4} />
      </div>

      <OrderStatusGlance newOrders={statusCounts.newOrders} inProduction={statusCounts.inProduction} delivered={statusCounts.delivered} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
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
          <div className="card divide-y divide-border overflow-hidden">
            {(recentPayments ?? []).length === 0 && (
              <div className="p-6 text-center text-sm text-ink-muted">No payments recorded yet.</div>
            )}
            {(recentPayments ?? []).map((p: any) => (
              <div key={p.id} className="p-3.5 flex items-center gap-3 text-sm hover:bg-sunken/50 transition-colors">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundImage: "var(--grad-teal)" }}
                >
                  ₵
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-ink truncate">{p.type}</div>
                  <div className="text-xs text-ink-muted">{p.method}</div>
                </div>
                <div className="font-mono font-semibold text-ink flex-shrink-0">₵{Number(p.amount).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <a href="/training-plans" className="card card-hover card-glow p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Training health</div>
          <div className="mt-2 font-display text-2xl font-semibold text-gradient-brand">{approvedTraining} / {trainingRows.length}</div>
          <p className="mt-1 text-xs text-ink-muted">Tasks approved across your apprentice programme</p>
        </a>
        <a href="/training-plans" className="card card-hover card-glow p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Needs review</div>
          <div className={`mt-2 font-display text-2xl font-semibold ${submittedTraining ? "text-warning" : "text-success"}`}>{submittedTraining}</div>
          <p className="mt-1 text-xs text-ink-muted">Apprentice submissions waiting for marking</p>
        </a>
        <a href="/apprentices" className="card card-hover card-glow p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">People operations</div>
          <div className="mt-2 font-display text-lg font-semibold text-ink">Review your team</div>
          <p className="mt-1 text-xs text-ink-muted">Open apprentices, trainers, and workforce records</p>
        </a>
      </div>
    </div>
  );
}
