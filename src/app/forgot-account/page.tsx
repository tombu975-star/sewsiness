import { ForgotAccountForm } from "./ForgotAccountForm";
import { getPlatformSettings } from "@/lib/platform-settings";

export default async function ForgotAccountPage() {
  const platform = await getPlatformSettings();
  return <ForgotAccountForm platform={platform} />;
}
