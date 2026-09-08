"use client";

import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/shop/welcome");
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full rounded-full border border-border-strong bg-surface px-4 py-3 text-sm font-semibold text-ink transition hover:bg-sunken"
    >
      Sign out
    </button>
  );
}
