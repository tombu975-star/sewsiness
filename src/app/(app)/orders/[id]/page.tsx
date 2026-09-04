import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/Button";
import { SubmitButton } from "@/components/SubmitButton";
import { Tabs } from "@/components/Tabs";
import { TapeStepper } from "@/components/TapeStepper";
import { recordOrderPayment, startOrderProduction } from "../actions";
import { OrderStatusSelect } from "./OrderStatusSelect";
import { ProductionTab, FittingsTab, AlterationsTab, QualityControlTab, CostingTab } from "./OrderWorkflowTabs";

const ORDER_STATUSES = ["Pending", "In Progress", "Review", "Completed", "Overdue", "Cancelled"];
const PRODUCTION_STAGES = ["Cutting", "Sewing", "Finishing", "Pressing", "Ready"];

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { created?: string; tab?: string };
}) {
  const supabase = createClient();
  const { data: order } = await supabase
    .from("custom_orders")
    .select("*, customers(id, full_name, phone)")
    .eq("id", params.id)
    .single();

  if (!order) notFound();

  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, method, type, notes, created_at")
    .eq("order_id", params.id)
    .order("created_at", { ascending: false });

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  const restrictedCosting = !["owner", "manager", "super_admin"].includes(profile?.role ?? "");

  const [{ data: stages }, { data: fittings }, { data: alterations }, { data: qcChecks }, { data: orderCost }] = await Promise.all([
    supabase.from("production_stages").select("stage, status").eq("order_id", params.id),
    supabase.from("fittings").select("id, scheduled_at, outcome, notes").eq("order_id", params.id).order("scheduled_at"),
    supabase.from("alterations").select("id, description, status").eq("order_id", params.id).order("created_at", { ascending: false }),
    supabase.from("quality_checks").select("id, seams_ok, fit_ok, finishing_ok, passed, created_at").eq("order_id", params.id).order("created_at", { ascending: false }),
    restrictedCosting ? Promise.resolve({ data: null }) : supabase.from("order_costs").select("fabric_cost, labor_cost, overhead_cost, other_cost").eq("order_id", params.id).maybeSingle(),
  ]);

  const balance = Number(order.total_amount) - Number(order.amount_paid);

  return (
    <div>
      <PageHead
        title={`${order.order_number} · ${order.garment}`}
        subtitle={`Custom order for ${order.customers?.full_name ?? "—"}`}
        crumb={`Dressmaking / Custom Orders / ${order.order_number}`}
        actions={
          <>
            <Button href="/orders" variant="outline">
              ← Back to Orders
            </Button>
            <OrderStatusSelect orderId={order.id} current={order.status} options={ORDER_STATUSES} />
          </>
        }
      />

      {searchParams.created === "1" && (
        <div className="callout mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide mb-0.5">✓ Order created</div>
            <p>
              {order.order_number} is saved for {order.customers?.full_name ?? "this customer"}, due{" "}
              {order.due_date ? order.due_date : "whenever you set a date"}.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <form action={startOrderProduction}>
              <input type="hidden" name="order_id" value={order.id} />
              <SubmitButton pendingLabel="Starting…" className="!py-2 !px-3.5 text-xs">
                Start Production
              </SubmitButton>
            </form>
            <Button href="/dashboard" variant="outline">
              Back to Home
            </Button>
          </div>
        </div>
      )}

      <TapeStepper
        steps={PRODUCTION_STAGES.map((s) => ({ label: s }))}
        activeIndex={(() => {
          const idx = PRODUCTION_STAGES.findIndex((s) => {
            const found = stages?.find((st: any) => st.stage === s);
            return (found?.status ?? "Pending") !== "Done";
          });
          return idx === -1 ? PRODUCTION_STAGES.length - 1 : idx;
        })()}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Customer" value={order.customers?.full_name ?? "—"} />
        <StatCard label="Due Date" value={order.due_date ?? "—"} />
        <StatCard label="Total" value={`₵${Number(order.total_amount).toFixed(2)}`} />
        <StatCard label="Balance" value={`₵${balance.toFixed(2)}`} accent />
      </div>

      <div className="mb-5">
        <StatusBadge value={order.status} />
      </div>

      <Tabs
        defaultLabel={searchParams.tab === "production" ? "Production" : undefined}
        tabs={[
          {
            label: "Payments",
            content: (
              <div className="space-y-5">
                {balance > 0 && (
                  <form action={recordOrderPayment} className="card p-4 flex flex-wrap items-end gap-3">
                    <input type="hidden" name="order_id" value={order.id} />
                    <input type="hidden" name="customer_id" value={order.customers?.id ?? ""} />
                    <div>
                      <label className="block text-xs font-semibold text-ink-muted mb-1">Amount (₵)</label>
                      <input
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        max={balance}
                        required
                        className="w-32 rounded-sm border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-muted mb-1">Method</label>
                      <select name="method" className="rounded-sm border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-gold">
                        <option>Cash</option>
                        <option>Mobile Money</option>
                        <option>Bank Transfer</option>
                        <option>Card</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-muted mb-1">Type</label>
                      <select name="type" className="rounded-sm border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-gold">
                        <option>Deposit</option>
                        <option>Balance</option>
                        <option>Full</option>
                      </select>
                    </div>
                    <SubmitButton pendingLabel="Recording…">Record Payment</SubmitButton>
                  </form>
                )}
                <div className="card divide-y divide-border">
                  {(payments ?? []).length === 0 && (
                    <div className="p-6 text-center text-sm text-ink-muted">No payments recorded yet.</div>
                  )}
                  {(payments ?? []).map((p: any) => (
                    <div key={p.id} className="p-3.5 flex items-center justify-between text-sm">
                      <div>
                        <div className="font-medium text-ink">
                          {p.type} · {p.method}
                        </div>
                        <div className="text-xs text-ink-muted">{new Date(p.created_at).toLocaleString()}</div>
                      </div>
                      <div className="font-semibold text-ink">₵{Number(p.amount).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ),
          },
          {
            label: "Details",
            content: (
              <div className="card p-6 space-y-2 text-sm">
                <Row label="Garment" value={order.garment} />
                <Row label="Priority" value={order.priority} />
                <Row label="Customer phone" value={order.customers?.phone} />
                <Row label="Created" value={new Date(order.created_at).toLocaleString()} />
              </div>
            ),
          },
          { label: "Production", content: <ProductionTab orderId={order.id} stages={stages ?? []} /> },
          { label: "Fittings", content: <FittingsTab orderId={order.id} fittings={fittings ?? []} /> },
          { label: "Alterations", content: <AlterationsTab orderId={order.id} alterations={alterations ?? []} /> },
          { label: "Quality Control", content: <QualityControlTab orderId={order.id} checks={qcChecks ?? []} /> },
          { label: "Costing", content: <CostingTab orderId={order.id} cost={orderCost as any} revenue={Number(order.total_amount)} restricted={restrictedCosting} /> },
        ]}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between border-b border-border/70 pb-2">
      <span className="text-ink-muted">{label}</span>
      <span className="text-ink font-medium">{value ?? "—"}</span>
    </div>
  );
}

function Placeholder({ label }: { label: string }) {
  return <div className="card p-10 text-center text-sm text-ink-muted">{label} will appear here once that module is wired up.</div>;
}
