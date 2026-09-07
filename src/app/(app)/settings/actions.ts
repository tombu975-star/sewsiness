"use server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth/require-role";

const ANY_ROLE = ["owner", "manager", "staff", "trainer", "apprentice", "freelancer", "super_admin", "system_admin"] as const;

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

// Personal-account actions (profile details, avatar upload/remove, change
// password) moved to account/actions.ts when "My Account" became its own
// /account page instead of a Settings tab — see that file. Everything
// below here is org/branch/platform/system configuration, which stays
// gated to SETTINGS_ROLES.

export async function updateOrganization(formData: FormData) {
  const { profile } = await requireRole(["owner"]);
  const supabase = createClient();
  if (!profile.organization_id) throw new Error("Only a business Owner can update organization settings.");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Organization name is required.");
  if (name.length > 120) throw new Error("Organization name must be 120 characters or fewer.");
  const primaryColor = String(formData.get("primary_color") ?? "").trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(primaryColor)) throw new Error("Choose a valid six-digit brand color.");

  const { error } = await supabase.from("organizations").update({ name, primary_color: primaryColor }).eq("id", profile.organization_id);
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
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

  revalidatePath("/settings");
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

  revalidatePath("/settings");
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

// Creates a one-time upload URL on the server. This avoids depending on
// client-side Storage INSERT policies and keeps the image itself out of the
// server action request body.
export async function createPlatformLogoUpload(ext: "jpg" | "png" | "webp") {
  await requireRole(["super_admin"]);
  const path = `logo-${randomUUID()}.${ext}`;
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from("platform-branding").createSignedUploadUrl(path);
  if (error || !data?.token) throw new Error(error?.message ?? "Couldn't prepare the logo upload.");

  const { data: publicUrl } = admin.storage.from("platform-branding").getPublicUrl(path);
  return { path, token: data.token, publicUrl: publicUrl.publicUrl };
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
