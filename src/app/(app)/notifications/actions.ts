"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markAllRead(userId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
  if (error) throw new Error(error.message);
  revalidatePath("/notifications");
}
