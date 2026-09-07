import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/PageHead";
import { ROLES } from "@/lib/nav";
import type { Role } from "@/lib/types";
import { AvatarUpload } from "./AvatarUpload";
import { AccountCard } from "./AccountCard";
import { ProfileDetailsForm } from "./ProfileDetailsForm";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// My Account — every signed-in role's own identity, profile photo,
// contact details, password, and sign-out, all in one place. Split out
// of Settings, which is now reserved for org/branch/platform/system
// configuration that only Owner, Manager, Super Admin, and System
// Admin ever touch — everyone else (Staff, Apprentice, Freelancer,
// Trainer) has no Settings page to land on but still needs somewhere
// to manage their own account, so this page has no role restriction
// beyond being signed in at all (enforced by the (app) layout already).
export default async function AccountPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, role, organization_id, branch_id, avatar_url, created_at")
    .eq("id", user!.id)
    .single();

  const role = (profile?.role as Role) ?? "staff";

  const { data: org } = profile?.organization_id
    ? await supabase.from("organizations").select("name").eq("id", profile.organization_id).single()
    : { data: null };

  const { data: branch } = profile?.branch_id
    ? await supabase.from("branches").select("name").eq("id", profile.branch_id).single()
    : { data: null };

  const roleLabel = ROLES.find((r) => r.id === role)?.label ?? role;
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long" })
    : null;

  return (
    <div>
      <PageHead
        title="My Account"
        subtitle="Your identity, profile photo, contact details, and password."
        crumb="My Account"
      />

      <div className="space-y-5">
        {/* Identity card — same gradient hero + avatar pattern used on
            the Customer profile page (see .idcard/.idavatar/.idfacts in
            globals.css), applied here to the signed-in user's own
            account instead of a customer's. */}
        <div className="idcard max-w-lg">
          <div className="idavatar overflow-hidden">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={`${profile?.full_name ?? "Your"} profile photo`} className="w-full h-full object-cover" />
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

        <ProfileDetailsForm fullName={profile?.full_name ?? ""} phone={(profile as any)?.phone ?? ""} email={user?.email ?? ""} />

        <AccountCard />
      </div>
    </div>
  );
}
