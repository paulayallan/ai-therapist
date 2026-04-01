import { average } from "@/lib/utils";
import { demoAITwinProfile, demoAITwinSessions, demoAccountMemory, demoInsights, demoJournalEntries, demoMentalProfile, demoMirrorInsights, demoMoodLogs, demoPanicEpisodes, demoSessionSummaries, demoStrategySessions, demoSubscription } from "@/lib/demo-data";
import { mirrorInsightsPrompt } from "@/lib/ai/prompts";
import { mirrorInsightBatchSchema } from "@/lib/ai/schemas";
import { ensureAITwinProfile } from "@/lib/ai-twin";
import { generateMirrorInsightDrafts } from "@/lib/insight-engine";
import { getOpenAIClient } from "@/lib/openai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AITwinProfile, AITwinSession, AccountMemory, Insight, JournalEntry, MentalProfile, MirrorInsight, MoodLog, PanicEpisode, SessionSummary, StrategySession, Subscription } from "@/lib/types";

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      id: "demo-user",
      email: "demo@mentara.local"
    };
  }

  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export async function getSubscription(userId: string): Promise<Subscription> {
  const supabase = await createSupabaseServerClient();
  if (!supabase || userId === "demo-user") {
    return demoSubscription;
  }

  const { data } = await supabase
    .from("subscriptions")
    .select("plan, status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) {
    return {
      plan: "free",
      status: "inactive",
      currentPeriodEnd: null
    };
  }

  return {
    plan: data.plan ?? "free",
    status: data.status ?? "inactive",
    currentPeriodEnd: data.current_period_end
  };
}

export async function getMentalProfile(userId: string): Promise<MentalProfile | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase || userId === "demo-user") {
    return demoMentalProfile;
  }

  const { data } = await supabase
    .from("mental_profiles")
    .select("brings_you_here,current_mood,therapist_style,main_challenges, stress_level, sleep_quality, triggers, coping_methods, goals, therapy_experience")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;

  return {
    bringsYouHere: data.brings_you_here ?? [],
    currentMood: data.current_mood ?? 5,
    therapistStyle: data.therapist_style ?? "Practical Coach",
    mainChallenges: data.main_challenges ?? [],
    stressLevel: data.stress_level ?? 5,
    sleepQuality: data.sleep_quality ?? 5,
    triggers: data.triggers ?? [],
    copingMethods: data.coping_methods ?? [],
    goals: data.goals ?? [],
    therapyExperience: data.therapy_experience ?? ""
  };
}

export async function getRecentSessionSummaries(userId: string): Promise<SessionSummary[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase || userId === "demo-user") {
    return demoSessionSummaries;
  }

  const { data } = await supabase
    .from("session_summaries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  return (data ?? []).map((row) => ({
    id: row.id,
    conversationId: row.conversation_id,
    mainIssue: row.main_issue,
    emotionalState: row.emotional_state,
    possibleTriggers: row.possible_triggers ?? [],
    suggestedFocusArea: row.suggested_focus_area ?? "",
    emotionalThemes: row.emotional_themes ?? [],
    recurringIssues: row.recurring_issues ?? [],
    suggestedNextSteps: row.suggested_next_steps ?? [],
    summaryText: row.summary_text,
    createdAt: row.created_at
  }));
}

export async function getAccountMemory(userId: string): Promise<AccountMemory | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase || userId === "demo-user") {
    return demoAccountMemory;
  }

  const { data } = await supabase.from("account_memory").select("*").eq("user_id", userId).maybeSingle();

  if (!data) return null;

  return {
    userId: data.user_id,
    displayName: data.display_name ?? "",
    bringsYouHere: data.brings_you_here ?? [],
    therapistStyle: data.therapist_style ?? "Practical Coach",
    goals: data.goals ?? [],
    emotionalThemes: data.emotional_themes ?? [],
    recurringIssues: data.recurring_issues ?? [],
    commonTriggers: data.common_triggers ?? [],
    memorySummary: data.memory_summary ?? "",
    lastSessionSummary: data.last_session_summary ?? "",
    lastDetectedEmotion: data.last_detected_emotion ?? null,
    lastMood: data.last_mood ?? null,
    lastAnxietyLevel: data.last_anxiety_level ?? null,
    lastStressLevel: data.last_stress_level ?? null,
    lastSleepQuality: data.last_sleep_quality ?? null,
    updatedAt: data.updated_at
  };
}

export async function getStoredAITwinProfile(userId: string): Promise<AITwinProfile | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase || userId === "demo-user") {
    return demoAITwinProfile;
  }

  const { data } = await supabase.from("ai_twin_profiles").select("*").eq("user_id", userId).maybeSingle();

  if (!data) return null;

  return {
    userId: data.user_id,
    emotionalTendencies: data.emotional_tendencies ?? [],
    thinkingPatterns: data.thinking_patterns ?? [],
    commonTriggers: data.common_triggers ?? [],
    behavioralHabits: data.behavioral_habits ?? [],
    profileSummary: data.profile_summary ?? "",
    updatedAt: data.updated_at
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

export async function getPanicEpisodes(userId: string): Promise<PanicEpisode[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase || userId === "demo-user") {
    return demoPanicEpisodes;
  }

  const { data } = await supabase
    .from("panic_episodes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  return (data ?? []).map((row) => ({
    id: row.id,
    trigger: row.trigger,
    location: row.location,
    recoveryTime: row.recovery_time,
    checkIn: row.check_in,
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
    category: getInsightCategory(row.insight_type),
    description: row.description,
    confidence: getInsightConfidence(row.insight_type),
    basis: getInsightBasis(row.insight_type),
    generatedAt: row.generated_at
  }));
}

export async function getMirrorInsights(userId: string): Promise<MirrorInsight[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase || userId === "demo-user") {
    return demoMirrorInsights;
  }

  const { data } = await supabase
    .from("mirror_insights")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(3);

  return (data ?? []).map((row) => ({
    id: row.id,
    observation: row.observation,
    feedback: row.feedback ?? null,
    saved: row.saved ?? false,
    createdAt: row.created_at
  }));
}

export async function ensureWeeklyMirrorInsights(userId: string): Promise<MirrorInsight[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase || userId === "demo-user") {
    return demoMirrorInsights;
  }

  const existing = await getMirrorInsights(userId);
  const newest = existing[0];
  if (newest) {
    const ageMs = Date.now() - new Date(newest.createdAt).getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (ageMs < sevenDaysMs) {
      return existing;
    }
  }

  const [moodLogs, journalEntries, sessionSummaries, accountMemory] = await Promise.all([
    getMoodLogs(userId),
    getJournalEntries(userId),
    getRecentSessionSummaries(userId),
    getAccountMemory(userId)
  ]);

  const enoughData = moodLogs.length >= 7 || journalEntries.length >= 5 || sessionSummaries.length >= 3;
  if (!enoughData) {
    return existing;
  }

  let generated = generateMirrorInsightDrafts({
    moodLogs,
    journalEntries,
    sessionSummaries,
    accountMemory
  });

  const client = getOpenAIClient();
  if (client) {
    try {
      const completion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: mirrorInsightsPrompt },
          {
            role: "user",
            content: JSON.stringify({
              moodLogs,
              journalEntries,
              sessionSummaries,
              accountMemory
            })
          }
        ]
      });

      const content = completion.choices[0]?.message?.content;
      if (content) {
        const parsed = mirrorInsightBatchSchema.safeParse(JSON.parse(content));
        if (parsed.success) {
          generated = parsed.data.insights;
        }
      }
    } catch {
      // Fallback drafts are already available.
    }
  }

  if (!generated.length) {
    return existing;
  }

  await supabase.from("mirror_insights").insert(
    generated.map((insight) => ({
      user_id: userId,
      observation: insight.observation
    }))
  );

  return getMirrorInsights(userId);
}

export async function getStrategySessions(userId: string): Promise<StrategySession[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase || userId === "demo-user") {
    return demoStrategySessions;
  }

  const { data } = await supabase
    .from("strategy_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(12);

  return (data ?? []).map((row) => ({
    id: row.id,
    mode: row.mode,
    prompt: row.prompt,
    response: row.response_json,
    createdAt: row.created_at
  }));
}

export async function getAITwinSessions(userId: string): Promise<AITwinSession[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase || userId === "demo-user") {
    return demoAITwinSessions;
  }

  const { data } = await supabase
    .from("ai_twin_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(8);

  return (data ?? []).map((row) => ({
    id: row.id,
    question: row.question,
    response: row.response,
    createdAt: row.created_at
  }));
}

export async function getOrCreateAITwinProfile(userId: string): Promise<AITwinProfile | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase || userId === "demo-user") {
    return demoAITwinProfile;
  }

  const [moodLogs, journalEntries, sessionSummaries] = await Promise.all([
    getMoodLogs(userId),
    getJournalEntries(userId),
    getRecentSessionSummaries(userId)
  ]);

  const enoughData = moodLogs.length >= 3 || journalEntries.length >= 3 || sessionSummaries.length >= 2;
  if (!enoughData) {
    return null;
  }

  return ensureAITwinProfile({
    supabase,
    userId,
    moodLogs,
    journalEntries,
    sessionSummaries
  });
}

export function hasProAccess(subscription: Subscription) {
  return subscription.plan === "pro" || subscription.plan === "premium";
}

export function buildDashboardSummary(moodLogs: MoodLog[], journalEntries: JournalEntry[]) {
  return {
    avgMood: average(moodLogs.map((log) => log.mood)),
    avgAnxiety: average(moodLogs.map((log) => log.anxietyLevel)),
    avgSleep: average(moodLogs.map((log) => log.sleepQuality)),
    journalCount: journalEntries.length
  };
}

function getInsightCategory(insightType: Insight["insightType"]): Insight["category"] {
  switch (insightType) {
    case "timing":
    case "trigger":
      return "Stress pattern";
    case "correlation":
      return "Sleep correlation";
    case "distortion":
      return "Cognitive habit";
    case "progress":
      return "Recovery signal";
    case "theme":
      return "Emotional style";
    case "starter":
    default:
      return "Emotional style";
  }
}

function getInsightConfidence(insightType: Insight["insightType"]): NonNullable<Insight["confidence"]> {
  switch (insightType) {
    case "timing":
    case "correlation":
    case "progress":
      return "High confidence";
    case "distortion":
    case "trigger":
    case "theme":
      return "Medium confidence";
    case "starter":
    default:
      return "Low confidence";
  }
}

function getInsightBasis(insightType: Insight["insightType"]) {
  switch (insightType) {
    case "timing":
      return "Based on repeated timing patterns across recent mood and stress logs.";
    case "correlation":
      return "Based on recent sleep, stress, and anxiety movement.";
    case "distortion":
      return "Based on journal language and cognitive pattern detection.";
    case "progress":
      return "Based on your stored support history and recovery direction over time.";
    case "trigger":
      return "Based on repeated trigger signals across journaling, support, and panic check-ins.";
    case "theme":
      return "Based on recurring emotional themes across your written reflections.";
    case "starter":
    default:
      return "Based on early activity while the system is still building a stronger read.";
  }
}
