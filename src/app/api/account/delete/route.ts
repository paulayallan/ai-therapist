import { jsonError, jsonOk, requireUser } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Deletes the account and everything attached to it. Rows go first as the user
 * (so RLS still applies), then the auth record via the service role. The
 * schema's `on delete cascade` is the safety net, not the plan.
 */
const OWNED_TABLES = [
  "mirror_insights",
  "insights",
  "generated_insights",
  "weekly_summaries",
  "user_milestones",
  "user_activity_events",
  "daily_plan_items",
  "daily_plans",
  "daily_check_ins",
  "daily_observations",
  "daily_tool_recommendations",
  "daily_reminders",
  "tool_recommendations",
  "saved_tools",
  "usage_counters",
  "ai_twin_sessions",
  "ai_twin_profiles",
  "session_summaries",
  "panic_episodes",
  "journal_entries",
  "mood_logs",
  "conversations",
  "account_memory",
  "mental_profiles",
  "user_support_preferences",
  "user_insight_preferences",
  "push_notification_devices",
  "subscriptions",
];

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  let confirmation: string | undefined;
  try {
    confirmation = (await request.json())?.confirm;
  } catch {
    return jsonError("Expected a JSON body.");
  }
  if (confirmation !== "DELETE") return jsonError("Type DELETE to confirm.", 422);

  const supabase = await createSupabaseServerClient();

  for (const table of OWNED_TABLES) {
    // A table this deployment does not have is not a failure — the delete is
    // best-effort per table, and the cascade below is the guarantee.
    await supabase.from(table).delete().eq("user_id", user.id);
  }
  await supabase.from("profiles").delete().eq("id", user.id);

  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      return jsonError(
        "Your data has been deleted, but the login could not be removed. Contact support to finish.",
        500,
      );
    }
  } catch {
    return jsonError(
      "Your data has been deleted, but account removal is not configured on this deployment.",
      503,
    );
  }

  await supabase.auth.signOut();
  return jsonOk({ deleted: true });
}
