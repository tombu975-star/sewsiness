import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { ReceiveButton } from "./ReceiveButton";
import { requirePageRole } from "@/lib/auth/require-role";

export default async function GoodsReceivedPage() {
  await requirePageRole(["owner", "manager"]);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: pos } = await supabase
    .from("purchase_orders")
    .select("id, reference, total, status, suppliers(name)")
    .eq("organization_id", profile?.organization_id ?? "")
    .in("status", ["Ordered", "Received"])
    .order("created_at", { ascending: false });

  const rows = (pos ?? []) as any[];

  return (
    <div>
      <PageHead title="Goods Received" subtitle="Goods-received notes reconciled against purchase orders." crumb="Purchases / Goods Received" />
      {rows.length === 0 ? (
        <EmptyState icon="◫" title="Nothing to receive." description="Purchase orders marked Ordered will appear here to check in." />
      ) : (
        <div className="card divide-y divide-border">
          {rows.map((p) => (
            <div key={p.id} className="p-3.5 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-ink">{p.reference ?? "—"} · {p.suppliers?.name ?? "—"}</div>
                <div className="text-xs text-ink-muted">₵{Number(p.total).toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge value={p.status} />
                {p.status === "Ordered" && <ReceiveButton id={p.id} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
