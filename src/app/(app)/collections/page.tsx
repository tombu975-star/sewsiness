import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";

export default async function CollectionsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: collections } = await supabase
    .from("collections")
    .select("id, name, season")
    .eq("organization_id", profile?.organization_id ?? "")
    .order("name");

  const rows = (collections ?? []) as any[];

  return (
    <div>
      <PageHead title="Collections" subtitle={`${rows.length} · seasonal or themed groupings of designs`} crumb="Dressmaking / Collections" actions={<Button href="/collections/new">+ New Collection</Button>} />
      {rows.length === 0 ? (
        <EmptyState icon="✦" title="No collections yet." description="Group your designs into a seasonal or themed collection." actionLabel="New Collection" actionHref="/collections/new" />
      ) : (
        <DataTable
          columns={[{ key: "name", label: "Collection" }, { key: "season", label: "Season" }]}
          rows={rows.map((c) => ({ id: c.id, cells: { name: c.name, season: c.season ?? "—" } }))}
        />
      )}
    </div>
  );
}
