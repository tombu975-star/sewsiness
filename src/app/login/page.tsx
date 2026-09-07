import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { getPlatformSettings } from "@/lib/platform-settings";

export default async function LoginPage() {
  const platform = await getPlatformSettings();

  // Keep the auth flow in its tablet-style full-cover form layout even on
  // larger desktop screens. The chooser splash is intentionally skipped so
  // users land directly on the real sign-in form instead of a separate
  // loading/choice screen.
  const loginPlatform = { ...platform, coverImages: platform.loginCoverImage ? [platform.loginCoverImage] : [] };

  return (
    <Suspense fallback={null}>
      <LoginForm platform={loginPlatform} />
    </Suspense>
  );
}
