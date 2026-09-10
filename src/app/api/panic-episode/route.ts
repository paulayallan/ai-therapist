import { jsonError, jsonOk, readBody, recordActivity, requireUser } from "@/lib/api";
import { panicEpisodeSchema } from "@/lib/ai/schemas";
import { clientLocalDate } from "@/lib/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * SOS logging is never rate-limited. Someone in the middle of a panic episode
 * must not be told they have run out of anything.
 */
export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { data, response: badBody } = await readBody(request, panicEpisodeSchema);
  if (!data) return badBody;

  const supabase = await createSupabaseServerClient();
  const { data: saved, error } = await supabase
    .from("panic_episodes")
    .insert({
      user_id: user.id,
      trigger: data.trigger,
      location: data.location,
      recovery_time: data.recoveryTime,
      check_in: data.checkIn,
    })
    .select("id, trigger, location, recovery_time, check_in, created_at")
    .single();

  if (error) return jsonError("Could not log that session.", 500);

  await recordActivity(user.id, "panic_sos", clientLocalDate(), saved.id);

  return jsonOk({ episode: saved });
}
