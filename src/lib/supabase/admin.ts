import "server-only";

import { createClient } from "@supabase/supabase-js";
import { requireServiceRoleKey, requireSupabaseEnv } from "@/lib/supabase/env";

/**
 * Service-role client. It bypasses row-level security entirely, so it is used
 * in exactly two places, both of which have no user session to act as:
 *   - deleting an auth user after their rows have gone
 *   - the RevenueCat webhook, called by their servers rather than a browser
 * Never import this into anything that runs in the browser, and never reach
 * for it just because a query is awkward under RLS.
 */
export function createSupabaseAdminClient() {
  const { url } = requireSupabaseEnv();
  return createClient(url, requireServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
