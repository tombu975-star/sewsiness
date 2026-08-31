import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";
import { homePathForRole } from "@/lib/nav";

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
 * Same check as requireRole(), but for use at the top of a PAGE
 * component rather than a Server Action — redirects the wrong-role
 * person to their own home instead of throwing into an error boundary.
 *
 * This exists as its own explicit call at every /admin and /system
 * page (not just relying on middleware + RLS) on purpose: middleware
 * only walls Super Admin/System Admin OUT of business pages, it does
 * not wall other roles OUT of /admin or /system — that boundary is
 * this page-level check plus each table's RLS. Two independent layers
 * catch what either one alone might miss (see 019_security_fixes.sql
 * for a case where a gap in one layer — a view that turned out not to
 * inherit RLS — would have been caught immediately by this one).
 */
export async function requirePageRole(allowed: Role[]) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("organization_id, branch_id, role").eq("id", user.id).single();
  const role = (profile?.role as Role) ?? null;
  if (!role || !allowed.includes(role)) {
    redirect(homePathForRole(role ?? "staff"));
  }
  return { user, profile: profile! };
}
