import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { Tabs } from "@/components/Tabs";
import { SubmitButton } from "@/components/SubmitButton";
import { updateProfile, updateOrganization } from "./actions";
import { ChangePasswordForm } from "./ChangePasswordForm";

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("full_name, role, organization_id").eq("id", user!.id).single();
  const { data: org } = profile?.organization_id
    ? await supabase.from("organizations").select("name, primary_color").eq("id", profile.organization_id).single()
    : { data: null };

  // Super Admin is a platform-level account with no business of its own —
  // there's no "Organization" for it to edit here.
  const canEditOrg = profile?.role === "owner";

  return (
    <div>
      <PageHead title="Settings" subtitle="Organization, branch and personal account settings." crumb="Settings" />
      <Tabs
        tabs={[
          {
            label: "My Account",
            content: (
              <div className="space-y-5">
                <form action={updateProfile} className="card p-6 max-w-lg space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted mb-1.5">Full name</label>
                    <input name="full_name" defaultValue={profile?.full_name ?? ""} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted mb-1.5">Email</label>
                    <input value={user?.email ?? ""} disabled className="w-full rounded-lg border border-border bg-sunken px-3 py-2 text-sm text-ink-muted" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-muted mb-1.5">Role</label>
                    <input value={profile?.role ?? ""} disabled className="w-full rounded-lg border border-border bg-sunken px-3 py-2 text-sm text-ink-muted capitalize" />
                  </div>
                  <SubmitButton pendingLabel="Saving…">Save Changes</SubmitButton>
                </form>

                <ChangePasswordForm />
              </div>
            ),
          },
          {
            label: "Organization",
            content: canEditOrg ? (
              <form action={updateOrganization} className="card p-6 max-w-lg space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1.5">Organization name</label>
                  <input name="name" defaultValue={org?.name ?? ""} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-muted mb-1.5">Brand color</label>
                  <input name="primary_color" type="color" defaultValue={org?.primary_color ?? "#8a382a"} className="w-16 h-10 rounded-lg border border-border bg-surface" />
                </div>
                <SubmitButton pendingLabel="Saving…">Save Changes</SubmitButton>
              </form>
            ) : (
              <div className="card p-10 text-center text-sm text-ink-muted">Only Owner or Super Admin can edit organization settings.</div>
            ),
          },
          {
            label: "Branches",
            content: (
              <div className="card p-6 text-sm text-ink-muted">
                Manage branches from the <a href="/branches" className="text-indigo font-medium">Branches</a> page.
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
