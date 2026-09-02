"use server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/require-role";

// Logo/cover-image/advertisement uploads used to receive the raw file as
// part of these Server Actions' own FormData body, uploaded server-side
// via the service-role client. That hits the same wall
// src/app/signup/actions.ts ran into: Vercel Functions enforce a hard
// 4.5MB request-body ceiling no application config can raise, and these
// are meant to be genuine high-resolution marketing photography for the
// login screen, not something to compress down to fit. So instead the
// browser now uploads directly to Storage (PlatformBrandingForm.tsx,
// mirroring the pattern AvatarUpload.tsx already used for personal
// photos) — these three functions below only ever receive the
// resulting URL string afterward, never the file itself. Needs
// 039_platform_branding_direct_upload.sql's storage RLS policies to
// actually permit that direct browser write.

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
  const { data } = await supabase
    .from("platform_settings")
    .select("logo_url, cover_images, advertisements")
    .eq("id", 1)
    .single();
  const images = Array.isArray((data as any)?.cover_images)
    ? ((data as any).cover_images as unknown[]).filter((v): v is string => typeof v === "string")
    : [];
  const ads = Array.isArray((data as any)?.advertisements)
    ? ((data as any).advertisements as any[]).filter((v) => v && typeof v === "object")
    : [];
  return { logoUrl: (data as any)?.logo_url ?? null, images, ads };
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

export async function updatePlatformLogo(logoUrl: string) {
  const { user } = await requireRole(["super_admin"]);
  if (!logoUrl) throw new Error("Missing logo URL.");

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

export async function addPlatformCoverImage(imageUrl: string) {
  const { user } = await requireRole(["super_admin"]);
  if (!imageUrl) throw new Error("Missing image URL.");

  const { images } = await getPlatformSettingsRow();
  if (images.length >= 8) throw new Error("Up to 8 rolling cover images — remove one before adding another.");
  const nextImages = [...images, imageUrl];

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
// Advertisements — Super Admin only. A rolling set of promotional
// slides (image + headline + optional caption/link) mixed into the
// /login splash's rotation, alongside the plain cover images above.
// See 034_platform_advertisements.sql and LoginSplash.tsx.
// ============================================================

export async function addPlatformAdvertisement(input: {
  imageUrl: string;
  headline: string;
  caption: string;
  linkUrl: string;
}) {
  const { user } = await requireRole(["super_admin"]);

  const headline = input.headline.trim();
  if (!headline) throw new Error("Headline is required.");
  const caption = input.caption.trim();
  const linkUrlRaw = input.linkUrl.trim();
  if (linkUrlRaw && !/^https?:\/\//i.test(linkUrlRaw)) {
    throw new Error("Link must start with http:// or https://.");
  }
  if (!input.imageUrl) throw new Error("Missing image URL.");

  const { ads } = await getPlatformSettingsRow();
  if (ads.length >= 6) throw new Error("Up to 6 advertisements — remove one before adding another.");

  const nextAds = [
    ...ads,
    {
      id: randomUUID(),
      image_url: input.imageUrl,
      headline,
      caption: caption || null,
      link_url: linkUrlRaw || null,
    },
  ];

  const supabase = createClient();
  const { error } = await supabase
    .from("platform_settings")
    .update({ advertisements: nextAds, updated_at: new Date().toISOString(), updated_by: user.id })
    .eq("id", 1);
  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/login");
}

export async function removePlatformAdvertisement(formData: FormData) {
  const { user } = await requireRole(["super_admin"]);

  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing advertisement.");

  const { ads } = await getPlatformSettingsRow();
  const target = ads.find((a: any) => a.id === id);
  const nextAds = ads.filter((a: any) => a.id !== id);

  const supabase = createClient();
  const { error } = await supabase
    .from("platform_settings")
    .update({ advertisements: nextAds, updated_at: new Date().toISOString(), updated_by: user.id })
    .eq("id", 1);
  if (error) throw new Error(error.message);

  // Best-effort cleanup of the underlying file — see removePlatformCoverImage.
  try {
    if (target?.image_url) {
      const admin = createAdminClient();
      const marker = "/object/public/platform-branding/";
      const idx = String(target.image_url).indexOf(marker);
      if (idx !== -1) {
        const path = String(target.image_url).slice(idx + marker.length);
        await admin.storage.from("platform-branding").remove([path]);
      }
    }
  } catch {
    // non-fatal, see above
  }

  revalidatePath("/settings");
  revalidatePath("/login");
}

export async function movePlatformAdvertisement(formData: FormData) {
  const { user } = await requireRole(["super_admin"]);

  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction") ?? "");
  if (!id || (direction !== "up" && direction !== "down")) throw new Error("Invalid request.");

  const { ads } = await getPlatformSettingsRow();
  const idx = ads.findIndex((a: any) => a.id === id);
  if (idx === -1) throw new Error("Advertisement not found.");

  const swapWith = direction === "up" ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= ads.length) return; // already at the edge, nothing to do

  const nextAds = [...ads];
  [nextAds[idx], nextAds[swapWith]] = [nextAds[swapWith], nextAds[idx]];

  const supabase = createClient();
  const { error } = await supabase
    .from("platform_settings")
    .update({ advertisements: nextAds, updated_at: new Date().toISOString(), updated_by: user.id })
    .eq("id", 1);
  if (error) throw new Error(error.message);

  revalidatePath("/settings");
  revalidatePath("/login");
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
