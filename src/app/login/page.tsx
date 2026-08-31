import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { getPlatformSettings } from "@/lib/platform-settings";

export default async function LoginPage() {
  const platform = await getPlatformSettings();
  return (
    <Suspense fallback={null}>
      <LoginForm platform={platform} />
    </Suspense>
  );
}
