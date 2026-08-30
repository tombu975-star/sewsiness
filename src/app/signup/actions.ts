"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_FILE_BYTES = 6 * 1024 * 1024; // 6MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function extFor(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

function validateImage(file: File | null, label: string): string | null {
  if (!file || file.size === 0) return `${label} is required.`;
  if (file.size > MAX_FILE_BYTES) return `${label} is too large (max 6MB).`;
  if (!ALLOWED_TYPES.has(file.type)) return `${label} must be a JPG, PNG, or WEBP image.`;
  return null;
}

export async function submitBusinessSignup(formData: FormData): Promise<{ error: string } | void> {
  const businessName = String(formData.get("business_name") || "").trim();
  const region = String(formData.get("region") || "").trim();
  const ownerName = String(formData.get("owner_name") || "").trim();
  const ownerEmail = String(formData.get("owner_email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const ghanaCardNumber = String(formData.get("ghana_card_number") || "").trim();
  const cardFront = formData.get("ghana_card_front") as File | null;
  const cardBack = formData.get("ghana_card_back") as File | null;
  const selfie = formData.get("selfie") as File | null;

  if (!businessName || !ownerName || !ownerEmail || !ghanaCardNumber) {
    return { error: "Please fill in every required field." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  // Loose but real Ghana Card format check: GHA-XXXXXXXXX-X
  if (!/^GHA-\d{9}-\d$/i.test(ghanaCardNumber)) {
    return { error: "Ghana Card number should look like GHA-123456789-0." };
  }
  const cardFrontErr = validateImage(cardFront, "Ghana Card (front)");
  if (cardFrontErr) return { error: cardFrontErr };
  const cardBackErr = validateImage(cardBack, "Ghana Card (back)");
  if (cardBackErr) return { error: cardBackErr };
  const selfieErr = validateImage(selfie, "Your selfie");
  if (selfieErr) return { error: selfieErr };

  const admin = createAdminClient();

  // Track what we've created so we can unwind on any failure — an
  // auth user with no organization behind it would permanently block that
  // email address from ever signing up again.
  let createdUserId: string | null = null;
  let createdOrgId: string | null = null;
  const uploadedPaths: string[] = [];

  async function cleanup() {
    for (const path of uploadedPaths) {
      try {
        await admin.storage.from("kyc-documents").remove([path]);
      } catch {
        // best-effort — don't let cleanup itself throw
      }
    }
    if (createdOrgId) {
      try {
        await admin.from("organizations").delete().eq("id", createdOrgId);
      } catch {
        // best-effort
      }
    }
    if (createdUserId) {
      try {
        await admin.auth.admin.deleteUser(createdUserId);
      } catch {
        // best-effort
      }
    }
  }

  try {
    const { data: userRes, error: userErr } = await admin.auth.admin.createUser({
      email: ownerEmail,
      password,
      email_confirm: true, // Ghana Card + selfie review is the trust gate here, not an email click-through
      user_metadata: { full_name: ownerName },
    });
    if (userErr || !userRes?.user) {
      const msg = userErr?.message?.toLowerCase().includes("already")
        ? "An account with that email already exists. Try logging in instead."
        : userErr?.message || "Couldn't create your account.";
      return { error: msg };
    }
    createdUserId = userRes.user.id;

    const { data: org, error: orgErr } = await admin
      .from("organizations")
      .insert({
        name: businessName,
        region: region || null,
        plan: "Trial",
        status: "Active",
        verification_status: "pending",
        ghana_card_number: ghanaCardNumber,
        verification_submitted_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (orgErr || !org) {
      await cleanup();
      return { error: "Couldn't create your business workspace. Please try again." };
    }
    createdOrgId = org.id;

    const { data: branch, error: branchErr } = await admin
      .from("branches")
      .insert({ organization_id: org.id, name: "Main" })
      .select("id")
      .single();
    if (branchErr || !branch) {
      await cleanup();
      return { error: "Couldn't set up your business workspace. Please try again." };
    }

    const uploads: [File, string][] = [
      [cardFront as File, `${org.id}/ghana-card-front.${extFor(cardFront as File)}`],
      [cardBack as File, `${org.id}/ghana-card-back.${extFor(cardBack as File)}`],
      [selfie as File, `${org.id}/selfie.${extFor(selfie as File)}`],
    ];
    for (const [file, path] of uploads) {
      const { error: upErr } = await admin.storage.from("kyc-documents").upload(path, file, {
        contentType: file.type,
        upsert: true,
      });
      if (upErr) {
        await cleanup();
        return { error: "Couldn't upload your verification documents. Please try again." };
      }
      uploadedPaths.push(path);
    }

    const { error: updateOrgErr } = await admin
      .from("organizations")
      .update({
        ghana_card_front_path: uploadedPaths[0],
        ghana_card_back_path: uploadedPaths[1],
        selfie_path: uploadedPaths[2],
      })
      .eq("id", org.id);
    if (updateOrgErr) {
      await cleanup();
      return { error: "Couldn't finish saving your verification documents. Please try again." };
    }

    const { error: profileErr } = await admin.from("profiles").insert({
      id: createdUserId,
      organization_id: org.id,
      branch_id: branch.id,
      full_name: ownerName,
      role: "owner",
    });
    if (profileErr) {
      await cleanup();
      return { error: "Couldn't finish creating your account. Please try again." };
    }

    await admin.from("audit_logs").insert({
      organization_id: org.id,
      actor_id: createdUserId,
      action: "business_signup_submitted",
      entity: "organizations",
      entity_id: org.id,
    });
  } catch {
    await cleanup();
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/login?notice=signup-submitted");
}
