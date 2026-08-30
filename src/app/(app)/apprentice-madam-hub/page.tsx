import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";

export default async function MadamHubPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();
  const orgId = profile?.organization_id ?? "";

  const { data: apprentices } = await supabase
    .from("apprentice_profiles")
    .select("profile_id, training_level, start_date, profiles:profile_id(full_name), trainer:trainer_id(full_name)")
    .eq("organization_id", orgId);
  const rows = (apprentices ?? []) as any[];

  const ids = rows.map((a) => a.profile_id);
  const { data: portfolioItems } = ids.length
    ? await supabase.from("portfolio_items").select("apprentice_id").in("apprentice_id", ids)
    : { data: [] };

  return (
    <div>
      <PageHead
        title="Madam Hub"
        subtitle="An Owner's supervisory view across every apprentice — training progress, trainers assigned, and portfolio output."
        crumb="Apprentices / Madam Hub"
        actions={<Button href="/apprentices/new">+ Invite Apprentice</Button>}
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Total Apprentices" value={rows.length} />
        <StatCard label="Portfolio Pieces" value={(portfolioItems ?? []).length} />
        <StatCard label="Trainers Assigned" value={new Set(rows.map((a) => a.trainer?.full_name).filter(Boolean)).size} />
      </div>
      {rows.length === 0 ? (
        <EmptyState icon="⚘" title="No apprentices yet." description="Invite your first apprentice to see them here." actionLabel="Invite Apprentice" actionHref="/apprentices/new" />
      ) : (
        <DataTable
          columns={[{ key: "name", label: "Apprentice" }, { key: "level", label: "Level" }, { key: "trainer", label: "Trainer" }, { key: "start", label: "Start Date" }]}
          rows={rows.map((a) => ({ id: a.profile_id, cells: { name: a.profiles?.full_name, level: a.training_level ?? "—", trainer: a.trainer?.full_name ?? "Unassigned", start: a.start_date ?? "—" } }))}
        />
      )}
    </div>
  );
}
