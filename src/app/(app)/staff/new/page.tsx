import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { InviteStaffForm } from "./InviteStaffForm";

export default async function NewStaffPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();
  const { data: branches } = await supabase.from("branches").select("id, name").eq("organization_id", profile?.organization_id ?? "").order("name");

  return (
    <div>
      <PageHead title="Invite Staff" subtitle="Both Owner and Manager can add staff directly — no approval required." crumb="Staff / Invite" />
      <InviteStaffForm branches={branches ?? []} />
    </div>
  );
}
