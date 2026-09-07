import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { LoginSplash } from "./LoginSplash";
import { getPlatformSettings } from "@/lib/platform-settings";

export default async function LoginPage() {
  const platform = await getPlatformSettings();

  // The FORM itself (once the splash is dismissed) gets one calm, static
  // photo (loginCoverImage) rather than a rotating carousel — see
  // platform-settings.ts. Reusing the shared `coverImages` prop with a
  // single-item array is intentional: both LoginSplash and AuthCover
  // already treat a length-1 array as "no rotation, no dots", so this
  // needs no new branching in either component.
  const loginPlatform = { ...platform, coverImages: platform.loginCoverImage ? [platform.loginCoverImage] : [] };

  return (
    // The SPLASH screen (the loading/choose moment before the form),
    // unlike the form behind it, gets the full rotating cover set plus
    // any configured advertisements — see LoginSplash.tsx.
    <LoginSplash platform={platform}>
      <Suspense fallback={null}>
        <LoginForm platform={loginPlatform} />
      </Suspense>
    </LoginSplash>
  );
}
