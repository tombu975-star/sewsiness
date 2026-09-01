import { AcceptInviteForm } from "./AcceptInviteForm";
import { getPlatformSettings } from "@/lib/platform-settings";

export default async function AcceptInvitePage() {
  const platform = await getPlatformSettings();
  return <AcceptInviteForm platform={platform} />;
}
