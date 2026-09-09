import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { getDisabledFeatureKeys } from "@/lib/feature-flags";
import type { Profile, Role } from "@/lib/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, organization_id, branch_id, avatar_url")
    .eq("id", user.id)
    .single();

  const { data: org } = profile
    ? await supabase.from("organizations").select("name").eq("id", profile.organization_id).single()
    : { data: null };

  const { data: branch } = profile?.branch_id
    ? await supabase.from("branches").select("name").eq("id", profile.branch_id).single()
    : { data: null };

  const { count: unreadNotificationCount } = user
    ? await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false)
        .or(`user_id.eq.${user.id},user_id.is.null`)
    : { count: 0 };

  // Falls back gracefully if the profile row hasn't been provisioned yet —
  // still lets the person sign in and see a Settings/onboarding-style page
  // rather than a hard error.
  const role: Role = (profile?.role as Role) ?? "staff";
  const fullName = profile?.full_name ?? user.email ?? "User";
  // Super Admin and System Admin are both platform-level accounts, not
  // tied to any one business — never label the shell with a specific
  // business's name for either role.
  const isPlatformAccount = role === "super_admin" || role === "system_admin";
  const orgName = role === "super_admin"
    ? "Sewsiness Platform"
    : role === "system_admin"
      ? "Sewsiness — System Admin"
      : org?.name ?? "Sewiness";
  const branchName = isPlatformAccount ? null : branch?.name;

  // Super Admin/System Admin's own nav (SUPER_ADMIN_SIDEBAR / SYSTEM_ADMIN_SIDEBAR
  // in nav.ts) has no `featureKey`s at all — platform-oversight pages are never
  // switchable — so this lookup is only ever meaningful for business roles, but
  // it's cheap and harmless to fetch regardless.
  const disabledFeatureKeys = await getDisabledFeatureKeys();

  return (
    <AppShell
      role={role}
      fullName={fullName}
      orgName={orgName}
      branchName={branchName}
      avatarUrl={profile?.avatar_url ?? null}
      unreadNotificationCount={unreadNotificationCount ?? 0}
      disabledFeatureKeys={Array.from(disabledFeatureKeys)}
    >
      {children}
    </AppShell>
  );
}
