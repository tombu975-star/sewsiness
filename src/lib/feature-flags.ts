import { createClient } from "@/lib/supabase/server";

export interface FeatureFlag {
  key: string;
  label: string;
  description: string | null;
  enabled: boolean;
}

/**
 * Reads every feature flag visible to the current signed-in user. RLS
 * ("authenticated can read feature flags") lets any signed-in user read
 * flag state — only System Admin can change it (src/app/(app)/system/flags).
 */
export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("feature_flags").select("key, label, description, enabled").order("label");
  if (error) return [];
  return (data ?? []) as FeatureFlag[];
}

/**
 * Convenience check for gating a single feature in a Server Component:
 *
 *   const showCollections = await isFeatureEnabled("dressmaking_collections");
 *   if (!showCollections) return null; // or render a "coming soon" state
 *
 * Defaults to `false` (hidden) if the flag doesn't exist yet or the table
 * can't be reached — new/unfinished work stays off until System Admin
 * deliberately turns it on in /system/flags, never on by accident.
 */
export async function isFeatureEnabled(key: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase.from("feature_flags").select("enabled").eq("key", key).maybeSingle();
  return data?.enabled ?? false;
}
