"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/require-role";

const MAX_IMAGE_BYTES = 6 * 1024 * 1024; // 6MB
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function extFor(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

function validateImage(file: File | null, label: string): string | null {
  if (!file || file.size === 0) return `${label} is required.`;
  if (file.size > MAX_IMAGE_BYTES) return `${label} is too large (max 6MB).`;
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return `${label} must be a JPG, PNG, or WEBP image.`;
  return null;
}

export async function updateProfile(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const full_name = String(formData.get("full_name") ?? "").trim();
  if (!full_name) throw new Error("Name is required.");
  const phone = String(formData.get("phone") ?? "").trim();

  const { error } = await supabase.from("profiles").update({ full_name, phone: phone || null }).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
}

// Avatar upload is a two-step flow: the browser uploads the file straight
// to the 'avatars' bucket (public bucket, RLS scoped to the caller's own
// uid — see 016_platform_branding.sql) using the normal client, then
// calls this action just to persist the resulting public URL on the
// profile row. No admin client needed here — the person is only ever
// touching their own file and their own row.
export async function updateAvatarUrl(url: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/", "layout");
}

export async function removeAvatar() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/", "layout");
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

// ============================================================
// Platform Branding — Super Admin only. Controls the rolling cover
// images and logo shown on the shared auth screens (login, signup,
// forgot-password, landing) before anyone has signed in. Writes go
// through the service-role client for storage (the 'platform-branding'
// bucket has no anon/authenticated write policy — see
// 016_platform_branding.sql), gated by requireRole up front the same
// way every other Super/System Admin action in this codebase is.
// ============================================================

async function getPlatformSettingsRow() {
  const supabase = createClient();
  const { data } = await supabase.from("platform_settings").select("logo_url, cover_images").eq("id", 1).single();
  const images = Array.isArray((data as any)?.cover_images)
    ? ((data as any).cover_images as unknown[]).filter((v): v is string => typeof v === "string")
    : [];
  return { logoUrl: (data as any)?.logo_url ?? null, images };
}

export async function updatePlatformCoverCopy(formData: FormData) {
  const { user } = await requireRole(["super_admin"]);
  const supabase = createClient();

  const cover_headline = String(formData.get("cover_headline") ?? "").trim();
  const cover_subheadline = String(formData.get("cover_subheadline") ?? "").trim();
  if (!cover_headline) throw new Error("Headline is required.");

  const { error } = await supabase
    .from("platform_settings")
    .update({ cover_headline, cover_subheadline, updated_at: new Date().toISOString(), updated_by: user.id })
    .eq("id", 1);
  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/", "layout");
}

export async function updatePlatformLogo(formData: FormData) {
  const { user } = await requireRole(["super_admin"]);

  const file = formData.get("logo") as File | null;
  const err = validateImage(file, "Logo");
  if (err) throw new Error(err);

  const admin = createAdminClient();
  const path = `logo.${extFor(file as File)}`;
  const { error: upErr } = await admin.storage.from("platform-branding").upload(path, file as File, {
    contentType: (file as File).type,
    upsert: true,
  });
  if (upErr) throw new Error("Couldn't upload the logo. Please try again.");

  const { data: pub } = admin.storage.from("platform-branding").getPublicUrl(path);
  // Cache-bust so a re-upload of the same filename shows immediately
  // instead of the browser serving a stale cached image.
  const logoUrl = `${pub.publicUrl}?v=${Date.now()}`;

  const supabase = createClient();
  const { error } = await supabase
    .from("platform_settings")
    .update({ logo_url: logoUrl, updated_at: new Date().toISOString(), updated_by: user.id })
    .eq("id", 1);
  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/", "layout");
}

export async function removePlatformLogo() {
  const { user } = await requireRole(["super_admin"]);
  const supabase = createClient();

  const { error } = await supabase
    .from("platform_settings")
    .update({ logo_url: null, updated_at: new Date().toISOString(), updated_by: user.id })
    .eq("id", 1);
  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/", "layout");
}

export async function addPlatformCoverImage(formData: FormData) {
  const { user } = await requireRole(["super_admin"]);

  const file = formData.get("image") as File | null;
  const err = validateImage(file, "Cover image");
  if (err) throw new Error(err);

  const { images } = await getPlatformSettingsRow();
  if (images.length >= 8) throw new Error("Up to 8 rolling cover images — remove one before adding another.");

  const admin = createAdminClient();
  const path = `cover-${Date.now()}.${extFor(file as File)}`;
  const { error: upErr } = await admin.storage.from("platform-branding").upload(path, file as File, {
    contentType: (file as File).type,
    upsert: false,
  });
  if (upErr) throw new Error("Couldn't upload the image. Please try again.");

  const { data: pub } = admin.storage.from("platform-branding").getPublicUrl(path);
  const nextImages = [...images, pub.publicUrl];

  const supabase = createClient();
  const { error } = await supabase
    .from("platform_settings")
    .update({ cover_images: nextImages, updated_at: new Date().toISOString(), updated_by: user.id })
    .eq("id", 1);
  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/", "layout");
}

export async function removePlatformCoverImage(formData: FormData) {
  const { user } = await requireRole(["super_admin"]);

  const url = String(formData.get("url") ?? "");
  if (!url) throw new Error("Missing image.");

  const { images } = await getPlatformSettingsRow();
  const nextImages = images.filter((u) => u !== url);

  const supabase = createClient();
  const { error } = await supabase
    .from("platform_settings")
    .update({ cover_images: nextImages, updated_at: new Date().toISOString(), updated_by: user.id })
    .eq("id", 1);
  if (error) throw new Error(error.message);

  // Best-effort cleanup of the underlying file — the bucket URL path is
  // everything after the public bucket prefix. Not fatal if this misses;
  // an orphaned file in storage costs nothing and blocks nothing.
  try {
    const admin = createAdminClient();
    const marker = "/object/public/platform-branding/";
    const idx = url.indexOf(marker);
    if (idx !== -1) {
      const path = url.slice(idx + marker.length);
      await admin.storage.from("platform-branding").remove([path]);
    }
  } catch {
    // non-fatal, see above
  }

  revalidatePath("/settings");
  revalidatePath("/", "layout");
}

export async function movePlatformCoverImage(formData: FormData) {
  const { user } = await requireRole(["super_admin"]);

  const url = String(formData.get("url") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!url || (direction !== "up" && direction !== "down")) throw new Error("Invalid request.");

  const { images } = await getPlatformSettingsRow();
  const idx = images.indexOf(url);
  if (idx === -1) throw new Error("Image not found.");

  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= images.length) return; // already at the edge, nothing to do

  const nextImages = [...images];
  [nextImages[idx], nextImages[swapWith]] = [nextImages[swapWith], nextImages[idx]];

  const supabase = createClient();
  const { error } = await supabase
    .from("platform_settings")
    .update({ cover_images: nextImages, updated_at: new Date().toISOString(), updated_by: user.id })
    .eq("id", 1);
  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/", "layout");
}

// ============================================================
// Manager quick actions — a lightweight "add a branch" shortcut lives
// in the Settings > Branches tab for Owner and Manager alike, so Manager
// (who has no Organization tab of their own) still has something they
// can directly add from this page, not just view.
// ============================================================
export async function quickCreateBranch(formData: FormData) {
  const { profile } = await requireRole(["owner", "manager"]);
  const supabase = createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Branch name is required.");

  const { error } = await supabase.from("branches").insert({
    organization_id: profile.organization_id,
    name,
    city: formData.get("city") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/branches");
}
