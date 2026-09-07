import { Suspense } from "react";
import { ForgotPasswordForm } from "./ForgotPasswordForm";
import { getPlatformSettings } from "@/lib/platform-settings";

export default async function ForgotPasswordPage() {
  const platform = await getPlatformSettings();
  return (
    <Suspense fallback={null}>
      <ForgotPasswordForm platform={platform} />
    </Suspense>
  );
}
