import { average } from "@/lib/utils";
import { demoInsights, demoJournalEntries, demoMentalProfile, demoMoodLogs } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Insight, JournalEntry, MentalProfile, MoodLog } from "@/lib/types";

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      id: "demo-user",
      email: "demo@aitherapist.local"
    };
  }

  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function getMentalProfile(userId: string): Promise<MentalProfile | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase || userId === "demo-user") {
    return demoMentalProfile;
  }

  const { data } = await supabase
    .from("mental_profiles")
    .select("main_challenges, stress_level, sleep_quality, triggers, coping_methods, goals, therapy_experience")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;

  return {
    mainChallenges: data.main_challenges ?? [],
    stressLevel: data.stress_level ?? 5,
    sleepQuality: data.sleep_quality ?? 5,
    triggers: data.triggers ?? [],
    copingMethods: data.coping_methods ?? [],
    goals: data.goals ?? [],
    therapyExperience: data.therapy_experience ?? ""
  };
}

export async function getMoodLogs(userId: string): Promise<MoodLog[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase || userId === "demo-user") {
    return demoMoodLogs;
  }

  const { data } = await supabase
    .from("mood_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  return (data ?? []).map((row) => ({
    id: row.id,
    mood: row.mood,
    anxietyLevel: row.anxiety_level,
    energy: row.energy,
    stress: row.stress,
    sleepQuality: row.sleep_quality,
    notes: row.notes,
    createdAt: row.created_at
  }));
}

export async function getJournalEntries(userId: string): Promise<JournalEntry[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase || userId === "demo-user") {
    return demoJournalEntries;
  }

  const { data } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  return (data ?? []).map((row) => ({
    id: row.id,
    textContent: row.text_content,
    voiceUrl: row.voice_url,
    emotionalAnalysis: row.emotional_analysis_json,
    createdAt: row.created_at
  }));
}

export async function getInsights(userId: string): Promise<Insight[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase || userId === "demo-user") {
    return demoInsights;
  }

  const { data } = await supabase
    .from("insights")
    .select("*")
    .eq("user_id", userId)
    .order("generated_at", { ascending: false })
    .limit(10);

  return (data ?? []).map((row) => ({
    id: row.id,
    insightType: row.insight_type,
    description: row.description,
    generatedAt: row.generated_at
  }));
}

export function buildDashboardSummary(moodLogs: MoodLog[], journalEntries: JournalEntry[]) {
  return {
    avgMood: average(moodLogs.map((log) => log.mood)),
    avgAnxiety: average(moodLogs.map((log) => log.anxietyLevel)),
    avgSleep: average(moodLogs.map((log) => log.sleepQuality)),
    journalCount: journalEntries.length
  };
}
