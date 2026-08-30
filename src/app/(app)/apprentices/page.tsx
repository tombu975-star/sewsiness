import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";

export default async function ApprenticesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: apprentices } = await supabase
    .from("profiles")
    .select("id, full_name, apprentice_profiles(training_level, specialisation, start_date, trainer:trainer_id(full_name))")
    .eq("organization_id", profile?.organization_id ?? "")
    .eq("role", "apprentice")
    .order("full_name");

  const rows = (apprentices ?? []) as any[];

  return (
    <div>
      <PageHead
        title="Apprentices"
        subtitle={`${rows.length} on roster · self-service login enabled — invited apprentices sign in at /login and see only their own training`}
        crumb="Apprentices"
        actions={<Button href="/apprentices/new">+ Invite Apprentice</Button>}
      />
      {rows.length === 0 ? (
        <EmptyState
          icon="⚘"
          title="No apprentices yet."
          description="Invite your first apprentice — they'll receive an email to set their own password and sign in, scoped to only their training tasks and portfolio."
          actionLabel="Invite Apprentice"
          actionHref="/apprentices/new"
        />
      ) : (
        <DataTable
          columns={[
            { key: "name", label: "Name" },
            { key: "level", label: "Training Level" },
            { key: "specialisation", label: "Specialisation" },
            { key: "trainer", label: "Trainer" },
            { key: "start", label: "Start Date" },
          ]}
          rows={rows.map((a) => ({
            id: a.id,
            cells: {
              name: a.full_name,
              level: a.apprentice_profiles?.[0]?.training_level ?? "—",
              specialisation: a.apprentice_profiles?.[0]?.specialisation ?? "—",
              trainer: a.apprentice_profiles?.[0]?.trainer?.full_name ?? "—",
              start: a.apprentice_profiles?.[0]?.start_date ?? "—",
            },
          }))}
        />
      )}
    </div>
  );
}
