import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge } from "@/components/StatusBadge";
import { requirePageRole } from "@/lib/auth/require-role";

export default async function AlterationsPage() {
  await requirePageRole(["owner", "manager", "staff"]);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: alterations } = await supabase
    .from("alterations")
    .select("id, description, status, created_at, custom_orders(id, order_number, customers(full_name))")
    .eq("organization_id", profile?.organization_id ?? "")
    .order("created_at", { ascending: false });

  const rows = (alterations ?? []) as any[];

  return (
    <div>
      <PageHead title="Alterations" subtitle={`${rows.length} requests · post-delivery alteration requests and turnaround`} crumb="Dressmaking / Alterations" />
      {rows.length === 0 ? (
        <EmptyState icon="✎" title="No alteration requests." description="Requests logged from an order's detail page will appear here." />
      ) : (
        <div className="card divide-y divide-border">
          {rows.map((a) => (
            <a key={a.id} href={`/orders/${a.custom_orders?.id}`} className="p-3.5 flex items-center justify-between gap-3 hover:bg-sunken/40 transition-colors">
              <div>
                <div className="text-sm font-medium text-ink">{a.description}</div>
                <div className="text-xs text-ink-muted">{a.custom_orders?.order_number} · {a.custom_orders?.customers?.full_name ?? "—"}</div>
              </div>
              <StatusBadge value={a.status} />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
