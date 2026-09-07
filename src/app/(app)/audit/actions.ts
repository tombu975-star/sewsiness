"use server";

import { createClient } from "@/lib/supabase/server";

// Called from the client right before supabase.auth.signOut() actually
// runs, while the session (and therefore RLS's current_org_id()) is
// still live — signOut() itself happens client-side via supabase-js, so
// this is the one place we can still attribute the event to an
// organization before the session is gone. Best-effort and silent: a
// failure here must never block someone from actually signing out.
export async function logSignOut(reason: "manual" | "inactivity") {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();
    if (!profile?.organization_id) return; // Super Admin / System Admin have no org — audit_logs requires one

    await supabase.from("audit_logs").insert({
      organization_id: profile.organization_id,
      actor_id: user.id,
      action: reason === "inactivity" ? "signed_out_inactivity" : "signed_out",
      entity: "auth",
      entity_id: user.id,
    });
  } catch {
    // best-effort only
  }
}
