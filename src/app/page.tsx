import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { homePathForRole } from "@/lib/nav";
import type { Role } from "@/lib/types";
import { AuthCover } from "@/components/auth/AuthCover";
import { Button } from "@/components/Button";
import { getPlatformSettings } from "@/lib/platform-settings";

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

  const platform = await getPlatformSettings();

  return (
    <AuthCover
      mode="landing"
      logoUrl={platform.logoUrl}
      coverImages={platform.coverImages}
      headline={platform.coverHeadline}
      subheadline={platform.coverSubheadline}
    >
      <div className="text-center md:text-left">
        <h2 className="font-display font-bold text-2xl text-ink mb-2">Welcome</h2>
        <p className="text-sm text-ink-muted mb-8">
          Running a tailoring business? Create your workspace. Already have an account —
          Owner, Manager, Staff, Trainer, Apprentice, or Freelancer — sign in below.
        </p>
        <div className="flex flex-col gap-3">
          <Button href="/signup" variant="primary">
            Create a business account
          </Button>
          <Button href="/login" variant="outline">
            Log in
          </Button>
        </div>
        <div className="flex items-center justify-center md:justify-start gap-3 mt-5 text-xs font-semibold">
          <Link href="/open-account" className="text-indigo hover:underline">
            Open an Account
          </Link>
          <span className="text-ink-faint">|</span>
          <Link href="/forgot-account" className="text-indigo hover:underline">
            Forgot account number?
          </Link>
        </div>
      </div>
    </AuthCover>
  );
}
