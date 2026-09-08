import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { requirePageRegistryFeature } from "@/lib/auth/require-role";
import { InviteStatusBadge } from "@/components/InviteStatusBadge";
import { ResendInviteButton } from "@/components/ResendInviteButton";
import { deleteUser } from "../admin/users-actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function StaffPage() {
  await requirePageRegistryFeature(["owner", "manager"], "staff");
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id, role").eq("id", user!.id).single();
  const canDeleteUsers = profile?.role === "owner";

  const { data: staff } = await supabase
    .from("profiles")
    .select("id, full_name, role, branches(name)")
    .eq("organization_id", profile?.organization_id ?? "")
    .in("role", ["owner", "manager", "staff", "trainer"])
    .order("full_name");

  const { data: invites } = await supabase
    .from("invites")
    .select("id, user_id, status, expires_at")
    .eq("organization_id", profile?.organization_id ?? "");
  const inviteByUser = new Map((invites ?? []).map((i: any) => [i.user_id, i]));

  const rows = (staff ?? []) as any[];

  return (
    <div>
      <PageHead
        title="Staff"
        subtitle={`${rows.length} on team · Owner and Manager can both add staff directly — no approval required`}
        crumb="Staff"
        actions={<Button href="/staff/new">+ Invite Staff</Button>}
      />
      {rows.length === 0 ? (
        <EmptyState icon="☺" title="No staff yet." description="Invite a staff member — they'll receive an email to set their own password and sign in." actionLabel="Invite Staff" actionHref="/staff/new" />
      ) : (
        <DataTable
          columns={[
            { key: "name", label: "Name" },
            { key: "role", label: "Role" },
            { key: "branch", label: "Branch" },
            { key: "invite", label: "Invite" },
            { key: "action", label: "Actions", hideOnMobile: true },
          ]}
          rows={rows.map((s) => {
            const invite = inviteByUser.get(s.id);
            return {
              id: s.id,
              cells: {
                name: s.full_name,
                role: s.role,
                branch: s.branches?.name ?? "—",
                invite: invite ? (
                  <div>
                    <InviteStatusBadge status={invite.status} expiresAt={invite.expires_at} />
                    {invite.status !== "revoked" && (
                      <ResendInviteButton inviteId={invite.id} revalidatePath="/staff" status={invite.status} />
                    )}
                  </div>
                ) : (
                  <span className="text-ink-faint">—</span>
                ),
                action: canDeleteUsers ? (
                  <form action={deleteUser} className="inline-block">
                    <input type="hidden" name="profile_id" value={s.id} />
                    <SubmitButton variant="outline" pendingLabel="Deleting…" className="!px-2.5 !py-1 !text-[11px] border-danger/40 text-danger hover:bg-danger-soft">
                      Delete
                    </SubmitButton>
                  </form>
                ) : null,
              },
            };
          })}
        />
      )}
    </div>
  );
}
