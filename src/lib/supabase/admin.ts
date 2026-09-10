import "server-only";

import { createClient } from "@supabase/supabase-js";
import { requireServiceRoleKey, requireSupabaseEnv } from "@/lib/supabase/env";

/**
 * Service-role client. It bypasses row-level security entirely, so it is used
 * in exactly one place: deleting an auth user after their rows have gone.
 * Never import this into anything that runs in the browser.
 */
export function createSupabaseAdminClient() {
  const { url } = requireSupabaseEnv();
  return createClient(url, requireServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
