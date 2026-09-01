import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { SubmitButton } from "@/components/SubmitButton";
import { markAdvisoryNoteSeen } from "../admin/actions";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, organization_id")
    .eq("id", user!.id)
    .single();

  const orgId = profile?.organization_id;

  const [{ count: customerCount }, { count: orderCount }, { data: recentOrders }, { data: recentPayments }, { data: advisoryNotes }] =
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
    ]);

  const totalOutstanding = (recentOrders ?? []).reduce(
    (sum: number, o: any) => sum + (Number(o.total_amount) - Number(o.amount_paid)),
    0
  );
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
        crumb={`Owner · Today, ${today}`}
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatCard label="Customers" value={customerCount ?? 0} />
        <StatCard label="Active Orders" value={orderCount ?? 0} />
        <StatCard label="Revenue Today" value={`₵${revenueToday.toFixed(2)}`} accent />
        <StatCard label="Outstanding Balance" value={`₵${totalOutstanding.toFixed(2)}`} accent />
      </div>

      <div className="card p-5 mb-6">
        <h3 className="font-display text-[15px] font-semibold text-ink mb-4">Order status at a glance</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="w-11 h-11 rounded-full bg-gold-soft text-gold-ink flex items-center justify-center mx-auto mb-2 text-lg">◔</div>
            <div className="font-mono font-semibold text-xl text-ink">{statusCounts.pending}</div>
            <div className="text-xs text-ink-muted mt-0.5">Pending</div>
          </div>
          <div>
            <div className="w-11 h-11 rounded-full bg-info-soft text-info flex items-center justify-center mx-auto mb-2 text-lg">✂</div>
            <div className="font-mono font-semibold text-xl text-ink">{statusCounts.inProgress}</div>
            <div className="text-xs text-ink-muted mt-0.5">In Progress</div>
          </div>
          <div>
            <div className="w-11 h-11 rounded-full bg-success-soft text-success flex items-center justify-center mx-auto mb-2 text-lg">✓</div>
            <div className="font-mono font-semibold text-xl text-ink">{statusCounts.completed}</div>
            <div className="text-xs text-ink-muted mt-0.5">Completed</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold text-ink">Recent Orders</h2>
            <a href="/orders" className="text-sm font-semibold text-indigo">
              View all →
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
            <a href="/payments" className="text-sm font-semibold text-indigo">
              View all →
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
