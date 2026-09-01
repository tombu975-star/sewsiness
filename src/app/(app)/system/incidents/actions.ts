"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

export async function logIncident(formData: FormData) {
  const { user } = await requireRole(["system_admin"]);

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const area = String(formData.get("area") ?? "").trim();
  const severity = String(formData.get("severity") ?? "medium");
  if (!title) throw new Error("Title is required.");

  const supabase = createClient();
  const { error } = await supabase.from("system_incidents").insert({
    title,
    description: description || null,
    area: area || null,
    severity,
    status: "open",
    created_by: user.id,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/system/incidents");
  revalidatePath("/system");
}

export async function setIncidentStatus(formData: FormData) {
  const { user } = await requireRole(["system_admin"]);

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["open", "investigating", "resolved"].includes(status)) {
    throw new Error("Missing or invalid incident status.");
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("system_incidents")
    .update({
      status,
      resolved_at: status === "resolved" ? new Date().toISOString() : null,
      resolved_by: status === "resolved" ? user.id : null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/system/incidents");
  revalidatePath("/system");
}
