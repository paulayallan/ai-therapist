import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AccountMemory,
  DailyCheckIn,
  HomeworkList,
  Insight,
  JournalEntry,
  MentalProfile,
  MirrorInsight,
  MoodLog,
  PanicEpisode,
  Profile,
  SavedTool,
  SessionSummary,
  Subscription,
  SupportPreferences,
} from "@/lib/types";

/**
 * Every read runs as the signed-in user, so row-level security is what
 * enforces ownership. No query filters by user_id defensively — a redundant
 * `.eq("user_id", …)` would hide an RLS mistake rather than surface it.
 *
 * Column names here match the live schema exactly (migrations 0001–0034).
 */

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, display_name, ai_data_consent_granted, ai_data_consent_granted_at")
    .eq("id", userId)
    .maybeSingle();
  return (data as Profile) ?? null;
}

export async function getSubscription(): Promise<Subscription | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end, starter_trial_started_at, starter_trial_ends_at")
    .maybeSingle();
  if (!data) return null;

  return {
    plan: data.plan,
    status: data.status,
    currentPeriodEnd: data.current_period_end,
    starterTrialStartedAt: data.starter_trial_started_at,
    starterTrialEndsAt: data.starter_trial_ends_at,
  };
}

export async function getMentalProfile(): Promise<MentalProfile | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("mental_profiles")
    .select(
      "brings_you_here, current_mood, therapist_style, main_challenges, stress_level, sleep_quality, triggers, coping_methods, goals, therapy_experience",
    )
    .maybeSingle();
  return (data as MentalProfile) ?? null;
}

export async function getSupportPreferences(): Promise<SupportPreferences | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("user_support_preferences")
    .select("support_topics, symptom_frequency, goals, preferred_features, onboarding_completed")
    .maybeSingle();
  return (data as SupportPreferences) ?? null;
}

/**
 * Onboarding is complete when `user_support_preferences` says so — that is the
 * only table in the live schema carrying the flag.
 *
 * The fallback matters as much as the flag: accounts created before it existed
 * have no `onboarding_completed` anywhere, but they do have real profile
 * content. Without this check those people would be marched back through
 * onboarding, which for someone who has been using the app for months reads
 * like it forgot who they are.
 */
export async function isOnboarded(): Promise<boolean> {
  const [prefs, mental] = await Promise.all([getSupportPreferences(), getMentalProfile()]);
  if (prefs?.onboarding_completed) return true;
  return Boolean(mental && (mental.main_challenges.length > 0 || mental.goals.length > 0));
}

export async function getAccountMemory(): Promise<AccountMemory | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("account_memory")
    .select(
      "display_name, brings_you_here, therapist_style, goals, emotional_themes, recurring_issues, common_triggers, memory_snippets, memory_summary, last_session_summary, last_detected_emotion, last_mood, last_anxiety_level, last_stress_level, last_sleep_quality",
    )
    .maybeSingle();
  return (data as AccountMemory) ?? null;
}

/* ------------------------------------------------------------ daily loop */

export async function getCheckIns(days = 60): Promise<DailyCheckIn[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("daily_check_ins")
    .select(
      "id, mood, anxiety_level, sleep_quality, contributing_factors, other_factor, physical_symptoms, notes, local_date, created_at",
    )
    .order("local_date", { ascending: false })
    .limit(days);
  return (data as DailyCheckIn[]) ?? [];
}

export async function getCheckInForDate(localDate: string): Promise<DailyCheckIn | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("daily_check_ins")
    .select(
      "id, mood, anxiety_level, sleep_quality, contributing_factors, other_factor, physical_symptoms, notes, local_date, created_at",
    )
    .eq("local_date", localDate)
    .maybeSingle();
  return (data as DailyCheckIn) ?? null;
}

export async function getMoodLogs(limit = 60): Promise<MoodLog[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("mood_logs")
    .select("id, mood, anxiety_level, energy, stress, sleep_quality, notes, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as MoodLog[]) ?? [];
}

export async function getJournalEntries(limit = 30): Promise<JournalEntry[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("journal_entries")
    .select("id, text_content, voice_url, emotional_analysis_json, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as JournalEntry[]) ?? [];
}

export async function getPanicEpisodes(limit = 50): Promise<PanicEpisode[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("panic_episodes")
    .select("id, trigger, location, recovery_time, check_in, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as PanicEpisode[]) ?? [];
}

/* --------------------------------------------------------------- insights */

export async function getInsights(limit = 8): Promise<Insight[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("insights")
    .select(
      "id, insight_type, description, title, full_insight, share_insight, category, evidence_basis, source, generated_at",
    )
    .order("generated_at", { ascending: false })
    .limit(limit);
  return (data as Insight[]) ?? [];
}

export async function getMirrorInsights(limit = 6): Promise<MirrorInsight[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("mirror_insights")
    .select("id, observation, feedback, saved, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as MirrorInsight[]) ?? [];
}

/* ------------------------------------------------------------------- twin */

export async function getTwinProfile() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("ai_twin_profiles")
    .select(
      "emotional_tendencies, thinking_patterns, common_triggers, behavioral_habits, profile_summary, updated_at",
    )
    .maybeSingle();
  return data ?? null;
}

export async function getTwinSessions(limit = 20) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("ai_twin_sessions")
    .select("id, question, response, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getSessionSummaries(limit = 10): Promise<SessionSummary[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("session_summaries")
    .select(
      "id, main_issue, emotional_state, emotional_themes, recurring_issues, possible_triggers, suggested_next_steps, suggested_focus_area, summary_text, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as SessionSummary[]) ?? [];
}

/* ------------------------------------------------------------------ tools */

export async function getSavedTools(): Promise<SavedTool[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("saved_tools").select("tool_id, saved_at");
  return (data as SavedTool[]) ?? [];
}

/* --------------------------------------------------------------- homework */

export async function getHomeworkLists(): Promise<HomeworkList[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("homework_lists")
    .select(
      "id, title, description, due_date, source_type, status, created_at, homework_items(id, text, completed, completed_at, user_comment, priority, item_order, status)",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(30);

  if (!data) return [];

  return (data as unknown as (Omit<HomeworkList, "items"> & { homework_items: HomeworkList["items"] })[])
    .map((row) => ({
      ...row,
      items: [...(row.homework_items ?? [])].sort((a, b) => a.item_order - b.item_order),
    }));
}

/* ------------------------------------------------------------ chat history */

export async function getLatestConversationId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("conversations")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

export async function getMessages(conversationId: string, limit = 40) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("messages")
    .select("id, role, content, structured_json, emotional_state, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);
  return data ?? [];
}
