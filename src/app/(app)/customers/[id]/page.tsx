import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { Tabs } from "@/components/Tabs";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: customer } = await supabase
    .from("customers")
    .select("*, branches(name)")
    .eq("id", params.id)
    .single();

  if (!customer) notFound();

  const { data: orders } = await supabase
    .from("custom_orders")
    .select("id, order_number, garment, status, total_amount, amount_paid")
    .eq("customer_id", params.id)
    .order("created_at", { ascending: false });

  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, method, type, created_at")
    .eq("customer_id", params.id)
    .order("created_at", { ascending: false });

  const { data: measurements } = await supabase
    .from("measurements")
    .select("id, label, chest, waist, hips, shoulder, sleeve_length, garment_length, created_at")
    .eq("customer_id", params.id)
    .order("created_at", { ascending: false });

  const { data: materials } = await supabase
    .from("customer_materials")
    .select("id, description, quantity, received_at, returned")
    .eq("customer_id", params.id)
    .order("received_at", { ascending: false });

  const balance = (orders ?? []).reduce((s: number, o: any) => s + (Number(o.total_amount) - Number(o.amount_paid)), 0);

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div className="eyebrow">Customers / {customer.full_name}</div>
      </div>
      <div className="flex items-center justify-end gap-2 mb-4">
        <Button href="/customers" variant="outline">
          ← Back to Customers
        </Button>
        <Button href={`/orders/new?customer=${customer.id}`}>+ New Order</Button>
      </div>

      <div className="idcard mb-4">
        <div className="idavatar">{initials(customer.full_name)}</div>
        <h2 className="font-display text-xl font-semibold">{customer.full_name}</h2>
        <div className="idsub text-[12.5px] mb-4" style={{ color: "#D8CFEE" }}>
          {customer.branches?.name ?? "Customer"} · {customer.phone ?? "No phone on file"}
        </div>
        <div className="idfacts">
          <div>
            <b>{(orders ?? []).length}</b>
            <span>ORDERS</span>
          </div>
          <div>
            <b>₵{balance.toFixed(2)}</b>
            <span>BALANCE OWED</span>
          </div>
          <div>
            <b>{(measurements ?? []).length}</b>
            <span>MEASUREMENT SETS</span>
          </div>
        </div>
        <div className="quickrow flex justify-center gap-2.5 mt-4">
          {customer.phone && (
            <a href={`tel:${customer.phone}`} className="qbtn">📞</a>
          )}
          {customer.whatsapp && (
            <a href={`https://wa.me/${customer.whatsapp}`} className="qbtn">💬</a>
          )}
          {customer.email && (
            <a href={`mailto:${customer.email}`} className="qbtn">✉️</a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-6">
        <div className="tile"><span className="tic">✂</span>Orders</div>
        <div className="tile"><span className="tic">📐</span>Measurements</div>
        <div className="tile"><span className="tic">◉</span>Payments</div>
      </div>

      <Tabs
        tabs={[
          {
            label: "Overview",
            content: (
              <div className="card p-6 space-y-2 text-sm">
                <Row label="WhatsApp" value={customer.whatsapp} />
                <Row label="Email" value={customer.email} />
                <Row label="Gender" value={customer.gender} />
                <Row label="Notes" value={customer.notes} />
              </div>
            ),
          },
          {
            label: "Orders",
            content: (
              <DataTable
                columns={[
                  { key: "order", label: "Order" },
                  { key: "garment", label: "Garment" },
                  { key: "balance", label: "Balance" },
                  { key: "status", label: "Status", isStatus: true },
                ]}
                rows={(orders ?? []).map((o: any) => ({
                  id: o.id,
                  href: `/orders/${o.id}`,
                  cells: {
                    order: o.order_number,
                    garment: o.garment,
                    balance: `₵${(Number(o.total_amount) - Number(o.amount_paid)).toFixed(2)}`,
                    status: o.status,
                  },
                }))}
                emptyLabel="No orders for this customer yet."
              />
            ),
          },
          {
            label: "Payments",
            content: (
              <DataTable
                columns={[
                  { key: "type", label: "Type" },
                  { key: "amount", label: "Amount" },
                  { key: "method", label: "Method" },
                  { key: "date", label: "Date" },
                ]}
                rows={(payments ?? []).map((p: any) => ({
                  id: p.id,
                  cells: {
                    type: p.type,
                    amount: `₵${Number(p.amount).toFixed(2)}`,
                    method: p.method,
                    date: new Date(p.created_at).toLocaleDateString(),
                  },
                }))}
                emptyLabel="No payments recorded for this customer yet."
              />
            ),
          },
          { label: "Measurements", content: (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button href={`/measurements/new?customer=${customer.id}`}>+ Record Measurements</Button>
              </div>
              {(measurements ?? []).length === 0 ? (
                <div className="card p-10 text-center text-sm text-ink-muted">No measurements recorded for this customer yet.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(measurements ?? []).map((m: any) => (
                    <div key={m.id} className="card p-4 text-sm">
                      <div className="font-semibold text-ink mb-2">{m.label} · {new Date(m.created_at).toLocaleDateString()}</div>
                      <div className="grid grid-cols-2 gap-1.5 text-xs text-ink-muted">
                        <span>Chest: <b className="text-ink">{m.chest ?? "—"}</b></span>
                        <span>Waist: <b className="text-ink">{m.waist ?? "—"}</b></span>
                        <span>Hips: <b className="text-ink">{m.hips ?? "—"}</b></span>
                        <span>Shoulder: <b className="text-ink">{m.shoulder ?? "—"}</b></span>
                        <span>Sleeve: <b className="text-ink">{m.sleeve_length ?? "—"}</b></span>
                        <span>Garment: <b className="text-ink">{m.garment_length ?? "—"}</b></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) },
          { label: "Materials", content: (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button href={`/customer-materials/new?customer=${customer.id}`}>+ Log Material</Button>
              </div>
              <DataTable
                columns={[
                  { key: "description", label: "Material" },
                  { key: "quantity", label: "Quantity" },
                  { key: "received", label: "Received" },
                  { key: "status", label: "Status", isStatus: true },
                ]}
                rows={(materials ?? []).map((m: any) => ({
                  id: m.id,
                  cells: { description: m.description, quantity: m.quantity ?? "—", received: m.received_at, status: m.returned ? "Completed" : "Pending" },
                }))}
                emptyLabel="No customer-supplied materials logged yet."
              />
            </div>
          ) },
        ]}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between border-b border-border/70 pb-2">
      <span className="text-ink-muted">{label}</span>
      <span className="text-ink font-medium">{value ?? "—"}</span>
    </div>
  );
}

function PlaceholderTab({ label }: { label: string }) {
  return (
    <div className="card p-10 text-center text-sm text-ink-muted">
      {label[0].toUpperCase() + label.slice(1)} for this customer will appear here once that module is wired up.
    </div>
  );
}
