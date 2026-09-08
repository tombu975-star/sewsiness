import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homePathForRole } from "@/lib/nav";
import type { Role } from "@/lib/types";
import { isFeatureEnabled, getDisabledFeatureKeys } from "@/lib/feature-flags";

/**
 * Resolves the signed-in user's own profile (organization_id, branch_id,
 * role) from the server-side Supabase client. Redirects to /login if
 * there's no session, throws if the session has no profile row.
 *
 * Server Actions are callable directly (POST to the action's endpoint)
 * regardless of which page rendered the form that "normally" triggers
 * them — so every action that performs an org-scoped or privileged
 * write must check the caller's own role itself. It cannot rely on the
 * client-side page or nav only showing the button to the right roles.
 */
export async function requireProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, branch_id, role")
    .eq("id", user.id)
    .single();
  if (!profile) throw new Error("No organization found for this account.");

  return { user, profile };
}

/**
 * Same as requireProfile(), but also throws unless the caller's role is
 * one of `allowed`. Use this at the top of every Server Action that
 * mutates data beyond the caller's own row.
 */
export async function requireRole(allowed: Role[]) {
  const { user, profile } = await requireProfile();
  if (!profile.role || !allowed.includes(profile.role as Role)) {
    throw new Error(
      `You don't have permission to do that. This action requires the ${allowed.join(" or ")} role.`
    );
  }
  return { user, profile };
}

/**
 * Page-level counterpart to requireRole(), for use at the top of a
 * Server Component page (e.g. /admin/*, /system/*) rather than inside a
 * Server Action.
 *
 * middleware.ts already gives Super Admin and System Admin a hard wall
 * around their OWN allowed paths (SUPER_ADMIN_ALLOWED_PATHS /
 * SYSTEM_ADMIN_ALLOWED_PATHS) — but it never restricts every OTHER role
 * away from those paths, since it only redirects when the signed-in
 * role IS super_admin or system_admin. That leaves a gap: an Owner,
 * Manager, Staff, Apprentice, Freelancer or Trainer who simply types
 * /admin/... or /system/... into the URL bar hits the page directly.
 * Most of these pages are already saved by RLS returning nothing for a
 * non-privileged caller, but that's a fragile way to keep someone off a
 * page they were never meant to see — an empty/broken-looking screen
 * rather than a clean bounce, and one query away from a real leak if a
 * future page/table's RLS is ever slightly looser than it should be.
 *
 * Unlike requireRole() — which throws, appropriate for a Server Action
 * where the caller-facing error surfaces in a form's error state — this
 * redirects, appropriate for a page render: an unauthorized visitor is
 * sent to their own home page instead of Next's generic error screen.
 */
export async function requirePageRole(allowed: Role[]) {
  const { user, profile } = await requireProfile();
  if (!profile.role || !allowed.includes(profile.role as Role)) {
    redirect(homePathForRole(profile.role as Role));
  }
  return { user, profile };
}

export async function requirePageFeature(allowed: Role[], featureKey: string) {
  const result = await requirePageRole(allowed);
  if (!(await isFeatureEnabled(featureKey))) redirect(homePathForRole(result.profile.role as Role));
  return result;
}

export async function requireRoleFeature(allowed: Role[], featureKey: string) {
  const result = await requireRole(allowed);
  if (!(await isFeatureEnabled(featureKey))) throw new Error("This feature is currently unavailable.");
  return result;
}

/**
 * Page-level hard block for a FEATURE_REGISTRY module (src/lib/nav.ts) —
 * the ~17 already-shipped modules that System Admin can take offline
 * from /system/flags, as opposed to requirePageFeature's brand-new
 * opt-in-when-ready features.
 *
 * Deliberately does NOT reuse requirePageFeature/isFeatureEnabled():
 * that helper treats a missing flag row as OFF, which is right for new
 * work-in-progress but wrong here — every registry module is already
 * live in production, so a business with no row yet for e.g. "pos"
 * must still see it. This checks getDisabledFeatureKeys() instead,
 * which mirrors the same "missing row = on, except DEFAULT_OFF_FEATURE_KEYS"
 * rule the sidebar and /system/flags already use, so a URL visit and
 * the nav entry never disagree about whether a module is reachable.
 */
export async function requirePageRegistryFeature(allowed: Role[], featureKey: string) {
  const result = await requirePageRole(allowed);
  const disabled = await getDisabledFeatureKeys();
  if (disabled.has(featureKey)) redirect(homePathForRole(result.profile.role as Role));
  return result;
}

/** Server Action counterpart to requirePageRegistryFeature() — see its comment. */
export async function requireRoleRegistryFeature(allowed: Role[], featureKey: string) {
  const result = await requireRole(allowed);
  const disabled = await getDisabledFeatureKeys();
  if (disabled.has(featureKey)) throw new Error("This feature is currently unavailable.");
  return result;
}
