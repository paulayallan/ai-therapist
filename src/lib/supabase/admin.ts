import "server-only";

import { createClient } from "@supabase/supabase-js";
import { requireServiceRoleKey, requireSupabaseEnv } from "@/lib/supabase/env";

/**
 * Service-role client. It bypasses row-level security entirely, so it is used
 * only where there is no user session to act as, or where the database is
 * deliberately refusing the signed-in user:
 *   - deleting an auth user after their rows have gone
 *   - the RevenueCat webhook, called by their servers rather than a browser
 *   - practitioner verification, whose whole point is that a practitioner
 *     cannot do it themselves; every caller there passes requireAdmin() first
 * Never import this into anything that runs in the browser, and never reach
 * for it just because a query is awkward under RLS.
 */
export function createSupabaseAdminClient() {
  const { url } = requireSupabaseEnv();
  return createClient(url, requireServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
