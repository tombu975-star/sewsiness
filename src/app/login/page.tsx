import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { LoginSplash } from "./LoginSplash";
import { getPlatformSettings } from "@/lib/platform-settings";

export default async function LoginPage() {
  const platform = await getPlatformSettings();

  return (
    <LoginSplash platform={platform}>
      <Suspense fallback={null}>
        <LoginForm platform={platform} />
      </Suspense>
    </LoginSplash>
  );
}
