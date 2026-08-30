import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// SERVER-ONLY. Uses the service role key to call supabase.auth.admin.*
// (e.g. inviteUserByEmail). Never import this from a Client Component —
// it must only ever run inside a "use server" action or a route handler.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
