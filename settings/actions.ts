"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const full_name = String(formData.get("full_name") ?? "").trim();
  if (!full_name) throw new Error("Name is required.");

  const { error } = await supabase.from("profiles").update({ full_name }).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

export async function updateOrganization(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("organization_id, role").eq("id", user!.id).single();
  if (profile?.role !== "owner" || !profile.organization_id) {
    throw new Error("Only a business's Owner can update organization settings.");
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Organization name is required.");

  const { error } = await supabase.from("organizations").update({ name, primary_color: formData.get("primary_color") || "#8a382a" }).eq("id", profile?.organization_id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
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
