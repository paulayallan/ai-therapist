import type { SupabaseClient } from "@supabase/supabase-js";

type MemoryPatch = {
  displayName?: string;
  bringsYouHere?: string[];
  therapistStyle?: string;
  goals?: string[];
  emotionalThemes?: string[];
  recurringIssues?: string[];
  commonTriggers?: string[];
  memorySnippet?: string;
  lastSessionSummary?: string;
  lastDetectedEmotion?: "calm" | "anxious" | "sad" | "angry" | "overwhelmed";
  lastMood?: number;
  lastAnxietyLevel?: number;
  lastStressLevel?: number;
  lastSleepQuality?: number;
};

function uniqueList(values: Array<string | null | undefined>, limit = 8) {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])].slice(0, limit);
}

function mergeList(existing: string[] | null | undefined, incoming: string[] | null | undefined, limit = 8) {
  return uniqueList([...(incoming ?? []), ...(existing ?? [])], limit);
}

function buildMemorySummary(record: {
  brings_you_here?: string[] | null;
  therapist_style?: string | null;
  goals?: string[] | null;
  emotional_themes?: string[] | null;
  recurring_issues?: string[] | null;
  common_triggers?: string[] | null;
  memory_snippets?: string[] | null;
  last_session_summary?: string | null;
  last_mood?: number | null;
  last_anxiety_level?: number | null;
  last_stress_level?: number | null;
}) {
  const lines: string[] = [];

  if (record.brings_you_here?.length) {
    lines.push(`Came here for: ${record.brings_you_here.join(", ")}.`);
  }
  if (record.therapist_style) {
    lines.push(`Prefers therapist style: ${record.therapist_style}.`);
  }
  if (record.goals?.length) {
    lines.push(`Goals: ${record.goals.join(", ")}.`);
  }
  if (record.emotional_themes?.length) {
    lines.push(`Common emotional themes: ${record.emotional_themes.slice(0, 4).join(", ")}.`);
  }
  if (record.recurring_issues?.length) {
    lines.push(`Recurring issues: ${record.recurring_issues.slice(0, 4).join(", ")}.`);
  }
  if (record.common_triggers?.length) {
    lines.push(`Common triggers: ${record.common_triggers.slice(0, 4).join(", ")}.`);
  }
  if (record.last_mood || record.last_anxiety_level || record.last_stress_level) {
    lines.push(
      `Latest mood snapshot: mood ${record.last_mood ?? "?"}/10, anxiety ${record.last_anxiety_level ?? "?"}/10, stress ${record.last_stress_level ?? "?"}/10.`
    );
  }
  if (record.last_session_summary) {
    lines.push(`Latest session summary: ${record.last_session_summary}`);
  } else if (record.memory_snippets?.length) {
    lines.push(`Recent memory: ${record.memory_snippets[0]}`);
  }

  return lines.join(" ").trim();
}

export async function upsertAccountMemory(supabase: SupabaseClient, userId: string, patch: MemoryPatch) {
  const { data: existing } = await supabase.from("account_memory").select("*").eq("user_id", userId).maybeSingle();

  const nextRecord = {
    user_id: userId,
    display_name: patch.displayName ?? existing?.display_name ?? "",
    brings_you_here: mergeList(existing?.brings_you_here, patch.bringsYouHere, 6),
    therapist_style: patch.therapistStyle ?? existing?.therapist_style ?? "Practical Coach",
    goals: mergeList(existing?.goals, patch.goals, 6),
    emotional_themes: mergeList(existing?.emotional_themes, patch.emotionalThemes, 8),
    recurring_issues: mergeList(existing?.recurring_issues, patch.recurringIssues, 8),
    common_triggers: mergeList(existing?.common_triggers, patch.commonTriggers, 8),
    memory_snippets: mergeList(existing?.memory_snippets, patch.memorySnippet ? [patch.memorySnippet] : [], 10),
    last_session_summary: patch.lastSessionSummary ?? existing?.last_session_summary ?? "",
    last_detected_emotion: patch.lastDetectedEmotion ?? existing?.last_detected_emotion ?? null,
    last_mood: patch.lastMood ?? existing?.last_mood ?? null,
    last_anxiety_level: patch.lastAnxietyLevel ?? existing?.last_anxiety_level ?? null,
    last_stress_level: patch.lastStressLevel ?? existing?.last_stress_level ?? null,
    last_sleep_quality: patch.lastSleepQuality ?? existing?.last_sleep_quality ?? null,
    updated_at: new Date().toISOString()
  };

  const memory_summary = buildMemorySummary(nextRecord);

  return supabase.from("account_memory").upsert(
    {
      ...nextRecord,
      memory_summary
    },
    { onConflict: "user_id" }
  );
}
