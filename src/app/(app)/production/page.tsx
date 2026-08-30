import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { EmptyState } from "@/components/EmptyState";

const STAGES = ["Cutting", "Sewing", "Finishing", "Pressing", "Ready"];
const STAGE_COLORS: Record<string, string> = {
  Cutting: "#FBBF24",
  Sewing: "#A855F7",
  Finishing: "#4B1878",
  Pressing: "#B4433D",
  Ready: "#3F7A5D",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// An order's "current stage" is the earliest stage that isn't Done yet
// (or Ready, once everything before it is Done).
function currentStage(orderStages: { stage: string; status: string }[]) {
  for (const stage of STAGES) {
    const found = orderStages.find((s) => s.stage === stage);
    if ((found?.status ?? "Pending") !== "Done") return stage;
  }
  return "Ready";
}

export default async function ProductionPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: orders } = await supabase
    .from("custom_orders")
    .select("id, order_number, garment, due_date, status, customers(full_name)")
    .eq("organization_id", profile?.organization_id ?? "")
    .not("status", "in", "(Completed,Cancelled)")
    .order("created_at", { ascending: false });

  const { data: stages } = await supabase
    .from("production_stages")
    .select("order_id, stage, status")
    .eq("organization_id", profile?.organization_id ?? "");

  const rows = (orders ?? []) as any[];
  const stagesByOrder = (stages ?? []).reduce((acc: Record<string, any[]>, s: any) => {
    (acc[s.order_id] ??= []).push(s);
    return acc;
  }, {});

  const columns = STAGES.map((stage) => ({
    stage,
    items: rows.filter((o) => currentStage(stagesByOrder[o.id] ?? []) === stage),
  }));

  return (
    <div>
      <PageHead title="Production Board" subtitle="Every active order, grouped by its current stage." crumb="Dressmaking / Production" />
      {rows.length === 0 ? (
        <EmptyState icon="✂" title="Nothing in production." description="Active custom orders will appear here." />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 overflow-x-auto scrollbar-thin">
          {columns.map((col) => (
            <div key={col.stage} className="kcol">
              <div className="barmark" style={{ background: STAGE_COLORS[col.stage] }} />
              <h3>
                <span>{col.stage}</span>
                <span>{col.items.length}</span>
              </h3>
              {col.items.length === 0 && <div className="text-xs text-ink-faint px-1 py-4 text-center">—</div>}
              {col.items.map((o) => (
                <a key={o.id} href={`/orders/${o.id}`} className="kcard block">
                  <div className="ord">{o.order_number}</div>
                  <div className="nm">{o.customers?.full_name ?? "—"}</div>
                  <div className="meta flex items-center justify-between">
                    <span className="badge gold" style={{ background: "var(--gold-soft)", color: "var(--gold-ink)" }}>
                      {o.due_date ?? "No due date"}
                    </span>
                    <div className="who">{o.customers?.full_name ? initials(o.customers.full_name) : "—"}</div>
                  </div>
                </a>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
