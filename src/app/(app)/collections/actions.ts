"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRoleFeature } from "@/lib/auth/require-role";

export async function createCollection(formData: FormData) {
  const { profile } = await requireRoleFeature(["owner", "manager", "staff"], "dressmaking_collections");
  const supabase = createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Collection name is required.");

  const { error } = await supabase.from("collections").insert({
    organization_id: profile?.organization_id,
    name,
    season: formData.get("season") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/collections");
  redirect("/collections");
}
