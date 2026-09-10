import { jsonError, jsonOk, readBody, requireUser } from "@/lib/api";
import { onboardingSchema } from "@/lib/ai/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Writes across the four places the live schema keeps this: the mental
 * profile, support preferences, the display name on `profiles`, and the AI
 * consent flags. `account_memory` is seeded too, so the first support chat
 * already knows what they just told us.
 */
export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { data, response: badBody } = await readBody(request, onboardingSchema);
  if (!data) return badBody;

  const supabase = await createSupabaseServerClient();
  const now = new Date().toISOString();
  const displayName = data.displayName?.trim() || null;

  const { error: mentalError } = await supabase.from("mental_profiles").upsert(
    {
      user_id: user.id,
      brings_you_here: data.bringsYouHere,
      current_mood: data.currentMood,
      therapist_style: data.therapistStyle,
      main_challenges: data.mainChallenges,
      stress_level: data.stressLevel,
      sleep_quality: data.sleepQuality,
      triggers: data.triggers,
      coping_methods: data.copingMethods,
      goals: data.goals,
      therapy_experience: data.therapyExperience,
      onboarding_completed: true,
      updated_at: now,
    },
    { onConflict: "user_id" },
  );
  if (mentalError) return jsonError("Could not save your profile.", 500);

  const { error: prefsError } = await supabase.from("user_support_preferences").upsert(
    {
      user_id: user.id,
      support_topics: data.bringsYouHere,
      symptom_frequency: data.symptomFrequency ?? null,
      goals: data.goals,
      preferred_features: [],
      onboarding_completed: true,
      onboarding_completed_at: now,
      updated_at: now,
    },
    { onConflict: "user_id" },
  );
  if (prefsError) return jsonError("Could not save your preferences.", 500);

  await supabase
    .from("profiles")
    .update({
      display_name: displayName,
      ai_data_consent_granted: data.aiConsent,
      ai_data_consent_granted_at: data.aiConsent ? now : null,
      ai_data_consent_version: data.aiConsent ? "1" : null,
    })
    .eq("id", user.id);

  // Seed what the coach and Twin will read, so the first conversation is not
  // starting from nothing the person already typed.
  await supabase.from("account_memory").upsert(
    {
      user_id: user.id,
      display_name: displayName ?? "",
      brings_you_here: data.bringsYouHere,
      therapist_style: data.therapistStyle,
      goals: data.goals,
      common_triggers: data.triggers,
      last_mood: data.currentMood,
      last_stress_level: data.stressLevel,
      last_sleep_quality: data.sleepQuality,
      updated_at: now,
    },
    { onConflict: "user_id" },
  );

  return jsonOk({ onboarded: true });
}
