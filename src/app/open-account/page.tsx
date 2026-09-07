import { OpenAccountForm } from "./OpenAccountForm";
import { getPlatformSettings } from "@/lib/platform-settings";

export default async function OpenAccountPage() {
  const platform = await getPlatformSettings();
  return <OpenAccountForm platform={platform} />;
}
