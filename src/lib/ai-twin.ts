import type { SupabaseClient } from "@supabase/supabase-js";
import { aiTwinProfilePrompt, aiTwinResponsePrompt } from "@/lib/ai/prompts";
import { aiTwinProfileSchema, aiTwinResponseSchema } from "@/lib/ai/schemas";
import type { AITwinProfile, JournalEntry, MoodLog, SessionSummary } from "@/lib/types";
import { getOpenAIClient } from "@/lib/openai";

export function buildAITwinFallbackProfile({
  journalEntries,
  moodLogs,
  sessionSummaries
}: {
  journalEntries: JournalEntry[];
  moodLogs: MoodLog[];
  sessionSummaries: SessionSummary[];
}): Omit<AITwinProfile, "userId" | "updatedAt"> {
  const emotionalTendencies = deriveUnique([
    moodLogs.some((log) => log.anxietyLevel >= 7) ? "Your anxiety tends to spike fast on high-pressure days." : null,
    moodLogs.some((log) => log.stress >= 7) ? "Stress seems to build before important demands, not only during them." : null,
    sessionSummaries[0]?.emotionalState === "overwhelmed" ? "You can move from pressure into overwhelm quickly when there is too much ambiguity." : null
  ]);

  const thinkingPatterns = deriveUnique([
    ...journalEntries.flatMap((entry) => entry.emotionalAnalysis?.distortions ?? []),
    ...sessionSummaries.flatMap((summary) => summary.recurringIssues ?? [])
  ]).slice(0, 4);

  const commonTriggers = deriveUnique([
    ...journalEntries.flatMap((entry) => entry.emotionalAnalysis?.triggers ?? []),
    ...sessionSummaries.flatMap((summary) => summary.possibleTriggers ?? [])
  ]).slice(0, 4);

  const behavioralHabits = deriveUnique([
    moodLogs.some((log) => log.sleepQuality < 6) ? "Low-sleep periods seem to make your emotional reactions sharper." : null,
    journalEntries.length >= 3 ? "You tend to process what happened by writing and reflecting afterward." : null,
    sessionSummaries.some((summary) => /work|meeting|pressure/i.test(summary.mainIssue))
      ? "You often stay functional on the outside while carrying a lot of tension internally."
      : null
  ]);

  const profileSummary = [
    "Based on what we've seen about you, your stress often rises around uncertainty, pressure, or ambiguous situations.",
    commonTriggers.length ? `The strongest triggers so far are ${commonTriggers.slice(0, 2).join(" and ").toLowerCase()}.` : "",
    thinkingPatterns.length ? `Your common thinking patterns include ${thinkingPatterns.slice(0, 2).join(" and ").toLowerCase()}.` : "",
    behavioralHabits.length ? behavioralHabits[0] : ""
  ]
    .filter(Boolean)
    .join(" ");

  return {
    emotionalTendencies: emotionalTendencies.length ? emotionalTendencies : ["Your nervous system seems to react strongly when stress and uncertainty stack together."],
    thinkingPatterns: thinkingPatterns.length ? thinkingPatterns : ["You often search for certainty quickly when you feel emotionally activated."],
    commonTriggers: commonTriggers.length ? commonTriggers : ["uncertainty"],
    behavioralHabits: behavioralHabits.length ? behavioralHabits : ["You tend to reflect after the moment once the intensity has eased."],
    profileSummary
  };
}

export async function ensureAITwinProfile({
  supabase,
  userId,
  journalEntries,
  moodLogs,
  sessionSummaries,
  forceRefresh = false
}: {
  supabase: SupabaseClient;
  userId: string;
  journalEntries: JournalEntry[];
  moodLogs: MoodLog[];
  sessionSummaries: SessionSummary[];
  forceRefresh?: boolean;
}) {
  const { data: existing } = await supabase.from("ai_twin_profiles").select("*").eq("user_id", userId).maybeSingle();

  const latestSignalTimestamp = getLatestSignalTimestamp({ journalEntries, moodLogs, sessionSummaries });
  const shouldReuseExisting =
    existing &&
    !forceRefresh &&
    (!latestSignalTimestamp || new Date(existing.updated_at).getTime() >= new Date(latestSignalTimestamp).getTime());

  if (shouldReuseExisting) {
    return {
      userId: existing.user_id,
      emotionalTendencies: existing.emotional_tendencies ?? [],
      thinkingPatterns: existing.thinking_patterns ?? [],
      commonTriggers: existing.common_triggers ?? [],
      behavioralHabits: existing.behavioral_habits ?? [],
      profileSummary: existing.profile_summary ?? "",
      updatedAt: existing.updated_at
    } satisfies AITwinProfile;
  }

  let generated = buildAITwinFallbackProfile({ journalEntries, moodLogs, sessionSummaries });
  const client = getOpenAIClient();

  if (client) {
    try {
      const completion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: aiTwinProfilePrompt },
          {
            role: "user",
            content: JSON.stringify({
              moodLogs,
              journalEntries,
              sessionSummaries
            })
          }
        ]
      });

      const content = completion.choices[0]?.message?.content;
      if (content) {
        const parsed = aiTwinProfileSchema.safeParse(JSON.parse(content));
        if (parsed.success) {
          generated = {
            emotionalTendencies: parsed.data.emotional_tendencies,
            thinkingPatterns: parsed.data.thinking_patterns,
            commonTriggers: parsed.data.common_triggers,
            behavioralHabits: parsed.data.behavioral_habits,
            profileSummary: parsed.data.profile_summary
          };
        }
      }
    } catch {
      // fallback profile already prepared
    }
  }

  const updatedAt = new Date().toISOString();

  await supabase.from("ai_twin_profiles").upsert(
    {
      user_id: userId,
      emotional_tendencies: generated.emotionalTendencies,
      thinking_patterns: generated.thinkingPatterns,
      common_triggers: generated.commonTriggers,
      behavioral_habits: generated.behavioralHabits,
      profile_summary: generated.profileSummary,
      updated_at: updatedAt
    },
    { onConflict: "user_id" }
  );

  return {
    userId,
    ...generated,
    updatedAt
  } satisfies AITwinProfile;
}

export async function refreshAITwinProfileFromAccount({
  supabase,
  userId,
  forceRefresh = false
}: {
  supabase: SupabaseClient;
  userId: string;
  forceRefresh?: boolean;
}) {
  const [moodRows, journalRows, summaryRows] = await Promise.all([
    supabase.from("mood_logs").select("id,mood,anxiety_level,energy,stress,sleep_quality,notes,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(30),
    supabase
      .from("journal_entries")
      .select("id,text_content,voice_url,emotional_analysis_json,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("session_summaries")
      .select("id,conversation_id,main_issue,emotional_state,possible_triggers,suggested_focus_area,emotional_themes,recurring_issues,suggested_next_steps,summary_text,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10)
  ]);

  const moodLogs = (moodRows.data ?? []).map((row) => ({
    id: row.id,
    mood: row.mood,
    anxietyLevel: row.anxiety_level,
    energy: row.energy,
    stress: row.stress,
    sleepQuality: row.sleep_quality,
    notes: row.notes,
    createdAt: row.created_at
  }));

  const journalEntries = (journalRows.data ?? []).map((row) => ({
    id: row.id,
    textContent: row.text_content,
    voiceUrl: row.voice_url,
    emotionalAnalysis: row.emotional_analysis_json,
    createdAt: row.created_at
  }));

  const sessionSummaries = (summaryRows.data ?? []).map((row) => ({
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

  const enoughData = moodLogs.length >= 3 || journalEntries.length >= 3 || sessionSummaries.length >= 2;
  if (!enoughData) {
    return null;
  }

  return ensureAITwinProfile({
    supabase,
    userId,
    moodLogs,
    journalEntries,
    sessionSummaries,
    forceRefresh
  });
}

export async function generateAITwinResponse({
  question,
  profile
}: {
  question: string;
  profile: AITwinProfile;
}) {
  const fallbackResponse = [
    "Based on what we've seen about you,",
    profile.commonTriggers.length
      ? ` situations involving ${profile.commonTriggers.slice(0, 2).join(" and ").toLowerCase()} tend to shape how you react.`
      : " certain repeated stress patterns tend to shape how you react.",
    profile.thinkingPatterns.length
      ? ` Your mind often leans toward ${profile.thinkingPatterns[0].toLowerCase()} when you feel activated.`
      : "",
    question.toLowerCase().includes("react") || question.toLowerCase().includes("think")
      ? ` You usually make more sense of the moment after it passes than while you are inside it.`
      : ` The useful move is to read your own pattern first, rather than assuming this moment is completely new.`
  ]
    .join("")
    .trim();

  const client = getOpenAIClient();
  if (!client) {
    return fallbackResponse;
  }

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: aiTwinResponsePrompt },
        {
          role: "user",
          content: JSON.stringify({
            question,
            profile
          })
        }
      ]
    });

    const content = completion.choices[0]?.message?.content;
    if (content) {
      const parsed = aiTwinResponseSchema.safeParse(JSON.parse(content));
      if (parsed.success) {
        return parsed.data.response;
      }
    }
  } catch {
    return fallbackResponse;
  }

  return fallbackResponse;
}

function deriveUnique(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])];
}

function getLatestSignalTimestamp({
  journalEntries,
  moodLogs,
  sessionSummaries
}: {
  journalEntries: JournalEntry[];
  moodLogs: MoodLog[];
  sessionSummaries: SessionSummary[];
}) {
  return [...journalEntries.map((entry) => entry.createdAt), ...moodLogs.map((log) => log.createdAt), ...sessionSummaries.map((summary) => summary.createdAt)]
    .filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null;
}
