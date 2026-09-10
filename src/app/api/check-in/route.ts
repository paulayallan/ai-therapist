import { jsonError, jsonOk, readBody, recordActivity, requireUser, reserveUsage } from "@/lib/api";
import { checkInSchema } from "@/lib/ai/schemas";
import { isLocalDate } from "@/lib/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { data, response: badBody } = await readBody(request, checkInSchema);
  if (!data) return badBody;

  if (!isLocalDate(data.localDate)) {
    return jsonError("That date is not a real calendar date.", 422);
  }

  const supabase = await createSupabaseServerClient();

  // Updating today's existing check-in is free — the limit is on creating new
  // ones, so nobody is punished for correcting a tap.
  const { data: existing } = await supabase
    .from("daily_check_ins")
    .select("id")
    .eq("local_date", data.localDate)
    .maybeSingle();

  if (!existing) {
    const decision = await reserveUsage(user.id, "mood_checkin", data.localDate);
    if (!decision.allowed) {
      return jsonError(decision.message ?? "Limit reached.", 429, {
        upgradeTarget: decision.upgradeTarget,
        limit: decision.limit,
      });
    }
  }

  const row = {
    user_id: user.id,
    local_date: data.localDate,
    mood: data.mood,
    anxiety_level: data.anxietyLevel,
    sleep_quality: data.sleepQuality,
    contributing_factors: data.contributingFactors,
    other_factor: data.otherFactor?.trim() || null,
    physical_symptoms: data.physicalSymptoms,
    notes: data.notes?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  const query = existing
    ? supabase.from("daily_check_ins").update(row).eq("id", existing.id)
    : supabase.from("daily_check_ins").insert(row);

  const { data: saved, error } = await query
    .select(
      "id, mood, anxiety_level, sleep_quality, contributing_factors, other_factor, physical_symptoms, notes, local_date, created_at",
    )
    .single();

  if (error) return jsonError("Could not save that check-in.", 500);

  if (!existing) await recordActivity(user.id, "check_in", data.localDate, saved.id);

  return jsonOk({ checkIn: saved, updated: Boolean(existing) });
}
