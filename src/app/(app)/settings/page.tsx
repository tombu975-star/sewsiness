import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { Tabs } from "@/components/Tabs";
import { SubmitButton } from "@/components/SubmitButton";
import { SETTINGS_ROLES, homePathForRole } from "@/lib/nav";
import type { Role } from "@/lib/types";
import { updateOrganization } from "./actions";
import { PlatformBrandingForm } from "./PlatformBrandingForm";
import { SystemOverviewCard } from "./SystemOverviewCard";
import { BranchesQuickCard } from "./BranchesQuickCard";

// Settings is deliberately narrower than the rest of the app — it holds
// organization/branch/platform/system configuration, not day-to-day
// operational work, and not the signed-in person's own account (that
// lives at /account, reachable by every role). Only the roles that
// actually manage a business (Owner, Manager) or the platform itself
// (Super Admin, System Admin) get in here; everyone else is redirected
// to their own home. The sidebar already hides the link for other roles
// (src/lib/nav.ts) — this is the server-side backstop so a direct link
// can't bypass that.

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id, branch_id")
    .eq("id", user!.id)
    .single();

  const role = (profile?.role as Role) ?? "staff";
  if (!SETTINGS_ROLES.includes(role)) redirect(homePathForRole(role));

  const isOwner = role === "owner";
  const isManager = role === "manager";
  const isSuperAdmin = role === "super_admin";
  const isSystemAdmin = role === "system_admin";

  const { data: org } = profile?.organization_id
    ? await supabase.from("organizations").select("name, primary_color, plan, created_at").eq("id", profile.organization_id).single()
    : { data: null };

  const { data: branch } = profile?.branch_id
    ? await supabase.from("branches").select("name, city").eq("id", profile.branch_id).single()
    : { data: null };

  const { data: branchList } = isOwner || isManager
    ? await supabase.from("branches").select("id, name, city").eq("organization_id", profile?.organization_id ?? "").order("name")
    : { data: null };

  const { data: platform } = isSuperAdmin
    ? await supabase.from("platform_settings").select("logo_url, cover_images, cover_headline, cover_subheadline, advertisements").eq("id", 1).single()
    : { data: null };
  const platformCoverImages = Array.isArray((platform as any)?.cover_images)
    ? ((platform as any).cover_images as unknown[]).filter((v): v is string => typeof v === "string")
    : [];
  const platformAds = Array.isArray((platform as any)?.advertisements)
    ? ((platform as any).advertisements as any[])
        .filter((v): v is Record<string, unknown> => typeof v === "object" && v !== null)
        .map((v) => ({
          id: typeof v.id === "string" ? v.id : "",
          imageUrl: typeof v.image_url === "string" ? v.image_url : "",
          headline: typeof v.headline === "string" ? v.headline : "",
          caption: typeof v.caption === "string" ? v.caption : null,
          linkUrl: typeof v.link_url === "string" ? v.link_url : null,
        }))
        .filter((ad) => ad.id && ad.imageUrl && ad.headline)
    : [];

  let flagsOn = 0, flagsTotal = 0, integrationsTotal = 0, openIncidents = 0;
  if (isSystemAdmin) {
    const [{ data: flags }, { count: integrationsCount }, { count: openCount }] = await Promise.all([
      supabase.from("feature_flags").select("enabled"),
      supabase.from("integration_checks").select("*", { count: "exact", head: true }),
      supabase.from("system_incidents").select("*", { count: "exact", head: true }).neq("status", "resolved"),
    ]);
    flagsTotal = flags?.length ?? 0;
    flagsOn = (flags ?? []).filter((f: any) => f.enabled).length;
    integrationsTotal = integrationsCount ?? 0;
    openIncidents = openCount ?? 0;
  }

  const tabs: { label: string; content: React.ReactNode }[] = [];

  if (isOwner) {
    tabs.push({
      label: "Organization",
      content: (
        <form action={updateOrganization} className="card p-6 max-w-lg space-y-4">
          <div className="font-display font-semibold text-ink">Organization</div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Organization name</label>
            <input name="name" defaultValue={org?.name ?? ""} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1.5">Brand color</label>
            <input name="primary_color" type="color" defaultValue={org?.primary_color ?? "#8a382a"} className="w-16 h-10 rounded-lg border border-border bg-surface" />
          </div>
          {org?.plan && (
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Plan</label>
              <span className="badge bg-gold-soft text-gold-ink">{org.plan}</span>
            </div>
          )}
          <SubmitButton pendingLabel="Saving…">Save Changes</SubmitButton>
        </form>
      ),
    });
  }

  if (isOwner || isManager) {
    tabs.push({
      label: "Branches",
      content: <BranchesQuickCard branches={(branchList ?? []) as any[]} />,
    });
  }

  if (isSuperAdmin) {
    tabs.push({
      label: "Platform Branding",
      content: (
        <PlatformBrandingForm
          logoUrl={(platform as any)?.logo_url ?? null}
          coverImages={platformCoverImages}
          coverHeadline={(platform as any)?.cover_headline ?? ""}
          coverSubheadline={(platform as any)?.cover_subheadline ?? ""}
          ads={platformAds}
        />
      ),
    });
  }

  if (isSystemAdmin) {
    tabs.push({
      label: "System",
      content: (
        <SystemOverviewCard
          flagsOn={flagsOn}
          flagsTotal={flagsTotal}
          integrationsTotal={integrationsTotal}
          openIncidents={openIncidents}
        />
      ),
    });
  }

  return (
    <div>
      <PageHead
        title="Settings"
        subtitle="Business profile, workspace structure, and platform presentation. Looking for your own profile or password? That's under My Account."
        crumb="Settings"
      />
      <Tabs tabs={tabs} />
    </div>
  );
}
