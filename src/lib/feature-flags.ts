import { createClient } from "@/lib/supabase/server";
import { DEFAULT_OFF_FEATURE_KEYS } from "@/lib/nav";

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

/**
 * Keys from FEATURE_REGISTRY (src/lib/nav.ts) that a System Admin has
 * explicitly turned off. Used to filter the sidebar/mobile "More" menu
 * for every role in src/app/(app)/layout.tsx — see
 * filterNavByFeatures/filterMoreMenuByFeatures in nav.ts.
 *
 * Unlike isFeatureEnabled() above, a missing row here is NOT treated as
 * disabled — every registry feature is already live in production, so
 * only a row with enabled = false actually hides it. Fails open (empty
 * set, nothing hidden) if the table can't be reached, so a Supabase
 * hiccup never takes down navigation for every signed-in user.
 */
export async function getDisabledFeatureKeys(): Promise<Set<string>> {
  const supabase = createClient();
  const { data, error } = await supabase.from("feature_flags").select("key, enabled");
  // Fails open (nothing hidden) rather than silently locking every
  // business account out of the whole sidebar over a transient read error.
  if (error || !data) return new Set();

  const rowByKey = new Map(data.map((f) => [f.key as string, f.enabled as boolean]));
  const disabled = new Set<string>();

  for (const [key, enabled] of rowByKey) {
    if (!enabled) disabled.add(key);
  }
  // DEFAULT_OFF_FEATURE_KEYS with no row at all are also off — see the
  // comment on DEFAULT_OFF_FEATURE_KEYS in src/lib/nav.ts.
  for (const key of DEFAULT_OFF_FEATURE_KEYS) {
    if (!rowByKey.has(key)) disabled.add(key);
  }
  return disabled;
}
