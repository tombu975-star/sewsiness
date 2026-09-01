import { SignupForm } from "./SignupForm";
import { getPlatformSettings } from "@/lib/platform-settings";

export default async function SignupPage() {
  const platform = await getPlatformSettings();
  return <SignupForm platform={platform} />;
}
