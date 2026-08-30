import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { InviteApprenticeForm } from "./InviteApprenticeForm";

export default async function NewApprenticePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: trainers } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("organization_id", profile?.organization_id ?? "")
    .in("role", ["trainer", "owner", "manager"])
    .order("full_name");

  return (
    <div>
      <PageHead
        title="Invite Apprentice"
        subtitle="Sends an email invite to set a password and sign in — same pattern used for Staff."
        crumb="Apprentices / Invite"
      />
      <InviteApprenticeForm trainers={trainers ?? []} />
    </div>
  );
}
