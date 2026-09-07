import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { Tabs } from "@/components/Tabs";
import { SubmitButton } from "@/components/SubmitButton";
import { ROLES, homePathForRole } from "@/lib/nav";
import type { Role } from "@/lib/types";
import { updateProfile, updateOrganization } from "./actions";
import { AvatarUpload } from "./AvatarUpload";
import { AccountCard } from "./AccountCard";
import { PlatformBrandingForm } from "./PlatformBrandingForm";
import { SystemOverviewCard } from "./SystemOverviewCard";
import { BranchesQuickCard } from "./BranchesQuickCard";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Settings is deliberately narrower than the rest of the app — it holds
// account security plus organization/branch/platform configuration, not
// day-to-day operational work. Only the roles that actually manage a
// business (Owner, Manager) or the platform itself (Super Admin, System
// Admin) get in; everyone else is redirected to their own home. The
// sidebar already hides the link for other roles (src/lib/nav.ts) — this
// is the server-side backstop so a direct link can't bypass that.
const SETTINGS_ROLES: Role[] = ["owner", "manager", "super_admin", "system_admin"];

export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, role, organization_id, branch_id, avatar_url, created_at")
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

  const roleLabel = ROLES.find((r) => r.id === role)?.label ?? role;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long" })
    : null;

  const tabs: { label: string; content: React.ReactNode }[] = [
    {
      label: "My Account",
      content: (
        <div className="space-y-5">
          {/* Identity card — same gradient hero + avatar pattern used on
              the Customer profile page (see .idcard/.idavatar/.idfacts
              in globals.css), applied here to the signed-in user's own
              account instead of a customer's. */}
          <div className="idcard max-w-lg">
            <div className="idavatar overflow-hidden">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                initials(profile?.full_name ?? "?")
              )}
            </div>
            <h2 className="font-display text-xl font-semibold">{profile?.full_name ?? "—"}</h2>
            <div className="idsub text-[12.5px] mb-4" style={{ color: "#D8CFEE" }}>
              {roleLabel}
              {org?.name ? ` · ${org.name}` : ""}
            </div>
            <div className="idfacts">
              <div>
                <b>{org?.name ?? "Platform"}</b>
                <span>ORGANIZATION</span>
              </div>
              <div>
                <b>{branch?.name ?? "—"}</b>
                <span>BRANCH</span>
              </div>
              <div>
                <b>{memberSince ?? "—"}</b>
                <span>MEMBER SINCE</span>
              </div>
            </div>
            {(profile as any)?.phone || user?.email ? (
              <div className="quickrow flex justify-center gap-2.5 mt-4">
                {(profile as any)?.phone && (
                  <a href={`tel:${(profile as any).phone}`} className="qbtn" aria-label="Call">
                    📞
                  </a>
                )}
                {user?.email && (
                  <a href={`mailto:${user.email}`} className="qbtn" aria-label="Email">
                    ✉️
                  </a>
                )}
              </div>
            ) : null}
          </div>

          <div className="card p-6 max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="font-display font-semibold text-ink">Profile photo</div>
              <span className="badge bg-indigo-soft text-indigo">{roleLabel}</span>
            </div>
            <AvatarUpload userId={user!.id} fullName={profile?.full_name ?? ""} avatarUrl={profile?.avatar_url ?? null} />
          </div>

          <form action={updateProfile} className="card p-6 max-w-lg space-y-4">
            <div className="font-display font-semibold text-ink">Personal details</div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Full name</label>
              <input name="full_name" defaultValue={profile?.full_name ?? ""} required className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Phone</label>
              <input name="phone" type="tel" defaultValue={(profile as any)?.phone ?? ""} placeholder="e.g. 024 000 0000" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-gold" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1.5">Email</label>
              <input value={user?.email ?? ""} disabled className="w-full rounded-lg border border-border bg-sunken px-3 py-2 text-sm text-ink-muted" />
              <p className="text-[11px] text-ink-faint mt-1">Contact support to change the email on your account.</p>
            </div>
            <SubmitButton pendingLabel="Saving…">Save Changes</SubmitButton>
          </form>

          <AccountCard />
        </div>
      ),
    },
  ];

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
        subtitle="Account security, plus organization, branch and platform configuration for your role."
        crumb="Settings"
      />
      <Tabs tabs={tabs} />
    </div>
  );
}
