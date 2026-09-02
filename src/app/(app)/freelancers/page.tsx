import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { requirePageRole } from "@/lib/auth/require-role";
import { InviteStatusBadge } from "@/components/InviteStatusBadge";
import { ResendInviteButton } from "@/components/ResendInviteButton";

export default async function FreelancersPage() {
  await requirePageRole(["owner", "manager"]);
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user!.id).single();

  const { data: freelancers } = await supabase
    .from("profiles")
    .select("id, full_name, freelancer_profiles(primary_skill, specialisation, years_experience, location)")
    .eq("organization_id", profile?.organization_id ?? "")
    .eq("role", "freelancer")
    .order("full_name");

  const { data: invites } = await supabase
    .from("invites")
    .select("id, user_id, status, expires_at")
    .eq("organization_id", profile?.organization_id ?? "");
  const inviteByUser = new Map((invites ?? []).map((i: any) => [i.user_id, i]));

  const rows = (freelancers ?? []) as any[];

  return (
    <div>
      <PageHead
        title="Freelancers"
        subtitle={`${rows.length} in directory · self-service login enabled — scoped to only their own work requests and earnings`}
        crumb="Freelancers / Directory"
        actions={<Button href="/freelancers/new">+ Invite Freelancer</Button>}
      />
      {rows.length === 0 ? (
        <EmptyState
          icon="⚒"
          title="No freelancers yet."
          description="Invite your first freelancer — they'll receive an email to set their own password and sign in, scoped to only their own jobs and payments."
          actionLabel="Invite Freelancer"
          actionHref="/freelancers/new"
        />
      ) : (
        <DataTable
          columns={[
            { key: "name", label: "Name" },
            { key: "skill", label: "Primary Skill" },
            { key: "specialisation", label: "Specialisation" },
            { key: "experience", label: "Experience" },
            { key: "location", label: "Location" },
            { key: "invite", label: "Invite" },
          ]}
          rows={rows.map((f) => {
            const invite = inviteByUser.get(f.id);
            return {
              id: f.id,
              cells: {
                name: f.full_name,
                skill: f.freelancer_profiles?.[0]?.primary_skill ?? "—",
                specialisation: f.freelancer_profiles?.[0]?.specialisation ?? "—",
                experience: f.freelancer_profiles?.[0]?.years_experience
                  ? `${f.freelancer_profiles[0].years_experience} yrs`
                  : "—",
                location: f.freelancer_profiles?.[0]?.location ?? "—",
                invite: invite ? (
                  <div>
                    <InviteStatusBadge status={invite.status} expiresAt={invite.expires_at} />
                    {invite.status !== "revoked" && (
                      <ResendInviteButton inviteId={invite.id} revalidatePath="/freelancers" status={invite.status} />
                    )}
                  </div>
                ) : (
                  <span className="text-ink-faint">—</span>
                ),
              },
            };
          })}
        />
      )}
    </div>
  );
}
