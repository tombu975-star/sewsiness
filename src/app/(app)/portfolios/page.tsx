import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";

export default async function PortfoliosPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id, role").eq("id", user!.id).single();
  const isApprentice = profile?.role === "apprentice";

  let query = supabase
    .from("portfolio_items")
    .select("id, title, description, created_at, apprentice:apprentice_id(full_name)")
    .eq("organization_id", profile?.organization_id ?? "")
    .order("created_at", { ascending: false });
  if (isApprentice) query = query.eq("apprentice_id", user!.id);
  const { data: items } = await query;
  const rows = (items ?? []) as any[];

  return (
    <div>
      <PageHead
        title={isApprentice ? "My Portfolio" : "Portfolios"}
        subtitle={isApprentice ? "Showcase your completed work." : "Photo portfolio of work completed by each apprentice."}
        crumb="Apprentices / Portfolios"
        actions={<Button href="/portfolios/new">+ Add Piece</Button>}
      />
      {rows.length === 0 ? (
        <EmptyState icon="✦" title="No portfolio pieces yet." description="Add a completed piece to build your portfolio." actionLabel="Add Piece" actionHref="/portfolios/new" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((p) => (
            <div key={p.id} className="card p-4">
              <div className="w-full aspect-[4/3] rounded-sm bg-sunken mb-3 flex items-center justify-center text-ink-faint text-xs">
                No image yet
              </div>
              <div className="font-semibold text-sm text-ink">{p.title}</div>
              {!isApprentice && <div className="text-xs text-ink-muted mt-0.5">{p.apprentice?.full_name}</div>}
              {p.description && <p className="text-xs text-ink-muted mt-1.5">{p.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
