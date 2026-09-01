import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/DataTable";
import { EmptyState } from "@/components/EmptyState";
import { requirePageRole } from "@/lib/auth/require-role";

export default async function TrainerConsolePage() {
  await requirePageRole(["owner", "trainer"]);
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id, role").eq("id", user!.id).single();
  const isTrainer = profile?.role === "trainer";

  let apprenticeQuery = supabase
    .from("apprentice_profiles")
    .select("profile_id, training_level, specialisation, profiles:profile_id(full_name)")
    .eq("organization_id", profile?.organization_id ?? "");
  if (isTrainer) apprenticeQuery = apprenticeQuery.eq("trainer_id", user!.id);
  const { data: apprentices } = await apprenticeQuery;
  const rows = (apprentices ?? []) as any[];

  const ids = rows.map((a) => a.profile_id);
  const { data: tasks } = ids.length
    ? await supabase.from("training_tasks").select("apprentice_id, status").in("apprentice_id", ids)
    : { data: [] };
  const doneCount = (tasks ?? []).filter((t: any) => t.status === "Done").length;

  return (
    <div>
      <PageHead title="Trainer Console" subtitle="Assessment and reporting workspace for apprentices under your supervision." crumb="Trainer Console" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <StatCard label="Apprentices" value={rows.length} />
        <StatCard label="Tasks Completed" value={doneCount} accent />
        <StatCard label="Total Tasks" value={(tasks ?? []).length} />
      </div>
      {rows.length === 0 ? (
        <EmptyState icon="◎" title="No apprentices assigned yet." description="Apprentices assigned to you as trainer will appear here." />
      ) : (
        <DataTable
          columns={[{ key: "name", label: "Apprentice" }, { key: "level", label: "Level" }, { key: "specialisation", label: "Specialisation" }]}
          rows={rows.map((a) => ({ id: a.profile_id, href: "/apprentices", cells: { name: a.profiles?.full_name, level: a.training_level ?? "—", specialisation: a.specialisation ?? "—" } }))}
        />
      )}
    </div>
  );
}
