import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { requirePageRole } from "@/lib/auth/require-role";

export default async function FittingsPage() {
  await requirePageRole(["owner", "manager", "staff"]);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: fittings } = await supabase
    .from("fittings")
    .select("id, scheduled_at, outcome, custom_orders(id, order_number, garment, customers(full_name))")
    .eq("organization_id", profile?.organization_id ?? "")
    .order("scheduled_at", { ascending: true });

  const rows = (fittings ?? []) as any[];

  return (
    <div>
      <PageHead title="Fittings" subtitle={`${rows.length} scheduled · fitting appointments and outcomes per order`} crumb="Dressmaking / Fittings" />
      {rows.length === 0 ? (
        <EmptyState icon="◑" title="No fittings scheduled." description="Schedule a fitting from an order's detail page." />
      ) : (
        <div className="card divide-y divide-border">
          {rows.map((f) => (
            <a key={f.id} href={`/orders/${f.custom_orders?.id}`} className="p-3.5 flex items-center justify-between gap-3 hover:bg-sunken/40 transition-colors">
              <div>
                <div className="text-sm font-medium text-ink">{f.custom_orders?.order_number} · {f.custom_orders?.garment}</div>
                <div className="text-xs text-ink-muted">{f.custom_orders?.customers?.full_name ?? "—"} · {f.scheduled_at ? new Date(f.scheduled_at).toLocaleString() : "Unscheduled"}</div>
              </div>
              <StatusBadge value={f.outcome ?? "Pending"} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
