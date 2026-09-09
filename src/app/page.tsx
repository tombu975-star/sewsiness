import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homePathForRole } from "@/lib/nav";
import type { Role } from "@/lib/types";
import { LandingCarousel } from "./LandingCarousel";

// The actual landing content (hero, workflow, features, roles, CTA) is
// a client-side paginated carousel now — see LandingCarousel.tsx — so
// this page never scrolls: Next/dot navigation between fixed-viewport
// slides instead, matching the mockup's onboarding-carousel pattern.
// This file stays a Server Component only because the session check
// below needs it; everything visual lives in the client component.
export default async function RootPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    redirect(homePathForRole((profile?.role as Role) ?? "staff"));
  }

  return <LandingCarousel />;
}
