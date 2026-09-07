"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/require-role";

// Personal-account actions (profile details, avatar, password) — split out
// of settings/actions.ts when "My Account" moved from a Settings tab to its
// own /account page. Every role can reach this page, so requireRole below
// lists every role rather than the narrower SETTINGS_ROLES gate that
// settings/actions.ts still uses for org/branch/platform/system actions.
const ANY_ROLE = ["owner", "manager", "staff", "trainer", "apprentice", "freelancer", "super_admin", "system_admin"] as const;

export interface ProfileUpdateState {
  error?: string;
  success?: string;
}

export async function updateProfile(_prevState: ProfileUpdateState, formData: FormData): Promise<ProfileUpdateState> {
  try {
    const { user } = await requireRole([...ANY_ROLE]);
    const supabase = createClient();

    const full_name = String(formData.get("full_name") ?? "").trim();
    if (!full_name) throw new Error("Name is required.");
    if (full_name.length > 120) throw new Error("Name must be 120 characters or fewer.");
    const phone = String(formData.get("phone") ?? "").trim();
    if (phone.length > 40 || (phone && !/^[0-9+().\-\s]+$/.test(phone))) throw new Error("Enter a valid phone number.");

    const { error } = await supabase.from("profiles").update({ full_name, phone: phone || null }).eq("id", user.id);
    if (error) throw new Error(error.message);
    revalidatePath("/account");
    return { success: "Profile details updated." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update your profile." };
  }
}

// Avatar upload is a two-step flow: the browser uploads the file straight
// to the 'avatars' bucket (public bucket, RLS scoped to the caller's own
// uid — see 016_platform_branding.sql) using the normal client, then
// calls this action just to persist the resulting public URL on the
// profile row. No admin client needed here — the person is only ever
// touching their own file and their own row.
export async function updateAvatarUrl(url: string) {
  const { user } = await requireRole([...ANY_ROLE]);
  const supabase = createClient();
  const avatarPath = ownedAvatarPath(url, user.id);
  if (!avatarPath) throw new Error("Invalid profile photo URL.");
  const { data: current } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single();

  const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
  if (error) throw new Error(error.message);
  const oldPath = ownedAvatarPath(current?.avatar_url, user.id);
  if (oldPath && oldPath !== avatarPath) await createAdminClient().storage.from("avatars").remove([oldPath]);
  revalidatePath("/account");
  revalidatePath("/", "layout");
}

export async function removeAvatar() {
  const { user } = await requireRole([...ANY_ROLE]);
  const supabase = createClient();
  const { data: current } = await supabase.from("profiles").select("avatar_url").eq("id", user.id).single();

  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
  if (error) throw new Error(error.message);
  const oldPath = ownedAvatarPath(current?.avatar_url, user.id);
  if (oldPath) await createAdminClient().storage.from("avatars").remove([oldPath]);
  revalidatePath("/account");
  revalidatePath("/", "layout");
}

function ownedAvatarPath(url: string | null | undefined, userId: string) {
  if (!url || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  try {
    const parsed = new URL(url);
    const expectedOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin;
    const prefix = "/storage/v1/object/public/avatars/";
    if (parsed.origin !== expectedOrigin || !parsed.pathname.startsWith(prefix)) return null;
    const path = decodeURIComponent(parsed.pathname.slice(prefix.length));
    return path.startsWith(`${userId}/`) && !path.includes("..") ? path : null;
  } catch {
    return null;
  }
}

export interface ChangePasswordState {
  error?: string;
  success?: string;
}

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Not signed in." };

  const currentPassword = String(formData.get("current_password") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "All fields are required." };
  }
  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New password and confirmation don't match." };
  }

  // Re-verify the current password before allowing a change — confirms the
  // person typing is actually the account owner, not just an open session.
  const { error: verifyErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyErr) return { error: "Current password is incorrect." };

  const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
  if (updateErr) return { error: updateErr.message };

  return { success: "Password updated successfully." };
}
