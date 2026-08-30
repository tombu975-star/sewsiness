"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveMeasurement(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single();

  const customer_id = String(formData.get("customer_id") ?? "");
  if (!customer_id) throw new Error("A customer is required.");

  const num = (key: string) => (formData.get(key) ? Number(formData.get(key)) : null);

  const { error } = await supabase.from("measurements").insert({
    customer_id,
    organization_id: profile?.organization_id,
    label: (formData.get("label") as string) || "Standard",
    chest: num("chest"),
    waist: num("waist"),
    hips: num("hips"),
    shoulder: num("shoulder"),
    sleeve_length: num("sleeve_length"),
    garment_length: num("garment_length"),
    notes: formData.get("notes") || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/measurements");
  revalidatePath(`/customers/${customer_id}`);
  redirect(`/customers/${customer_id}`);
}
