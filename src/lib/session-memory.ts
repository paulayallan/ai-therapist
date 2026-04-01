import type { SupabaseClient } from "@supabase/supabase-js";
import { sessionSummaryPrompt } from "@/lib/ai/prompts";
import { sessionSummarySchema } from "@/lib/ai/schemas";
import { getOpenAIClient } from "@/lib/openai";
import { upsertAccountMemory } from "@/lib/memory";
import type { SessionSummary } from "@/lib/types";

function unique(values: string[], limit = 4) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(0, limit);
}

function inferTriggers(text: string, fallback: string[] = []) {
  const normalized = text.toLowerCase();
  const triggers = new Set<string>(fallback);

  if (normalized.includes("work") || normalized.includes("job") || normalized.includes("boss") || normalized.includes("meeting")) {
    triggers.add("work pressure");
  }
  if (normalized.includes("relationship") || normalized.includes("partner") || normalized.includes("text") || normalized.includes("ex")) {
    triggers.add("relationship uncertainty");
  }
  if (normalized.includes("sleep") || normalized.includes("tired") || normalized.includes("insomnia")) {
    triggers.add("poor sleep");
  }
  if (normalized.includes("family") || normalized.includes("mum") || normalized.includes("dad")) {
    triggers.add("family tension");
  }
  if (normalized.includes("money") || normalized.includes("rent") || normalized.includes("bills")) {
    triggers.add("financial pressure");
  }

  return [...triggers].slice(0, 4);
}

function inferFocusArea(mainIssue: string, emotionalState: SessionSummary["emotionalState"], possibleTriggers: string[]) {
  if (possibleTriggers.some((trigger) => trigger.includes("work"))) return "work anxiety regulation";
  if (possibleTriggers.some((trigger) => trigger.includes("relationship"))) return "relationship clarity";
  if (possibleTriggers.some((trigger) => trigger.includes("sleep"))) return "sleep and nervous-system regulation";
  if (emotionalState === "overwhelmed") return "nervous-system calming";
  if (mainIssue.toLowerCase().includes("confidence")) return "confidence rebuilding";
  return "pattern awareness and regulation";
}

function buildFallbackSummary({
  transcript,
  emotionalState,
  commonTriggers
}: {
  transcript: string;
  emotionalState: SessionSummary["emotionalState"];
  commonTriggers?: string[];
}) {
  const mainIssue = transcript.split("\n").find((line) => line.startsWith("USER:"))?.replace("USER:", "").trim() || "current emotional pressure";
  const possibleTriggers = inferTriggers(transcript, commonTriggers);
  const suggestedFocusArea = inferFocusArea(mainIssue, emotionalState, possibleTriggers);
  const nextStep =
    emotionalState === "overwhelmed" || emotionalState === "anxious"
      ? "breathing exercise"
      : emotionalState === "sad"
        ? "journaling prompt"
        : "thought reframing";

  return {
    main_issue: mainIssue.slice(0, 120),
    emotional_state: emotionalState,
    possible_triggers: possibleTriggers,
    suggested_focus_area: suggestedFocusArea,
    emotional_themes: unique([emotionalState, suggestedFocusArea]),
    recurring_issues: unique(possibleTriggers.length ? possibleTriggers : [mainIssue]),
    suggested_next_steps: [nextStep],
    summary_text: `Today's focus: ${mainIssue.slice(0, 80)}. Suggested next step: ${nextStep}.`
  };
}

export async function createSessionSummaryForConversation({
  supabase,
  userId,
  conversationId,
  displayName,
  fallbackEmotion,
  commonTriggers
}: {
  supabase: SupabaseClient;
  userId: string;
  conversationId: string;
  displayName: string;
  fallbackEmotion: SessionSummary["emotionalState"];
  commonTriggers?: string[];
}) {
  const { data: messages } = await supabase
    .from("messages")
    .select("role,content,emotional_state")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  const transcript = (messages ?? [])
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n");

  const client = getOpenAIClient();
  let summary = buildFallbackSummary({
    transcript,
    emotionalState: fallbackEmotion,
    commonTriggers
  });

  if (client && transcript.trim()) {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: sessionSummaryPrompt },
        { role: "user", content: transcript }
      ]
    });

    const content = completion.choices[0]?.message?.content;
    if (content) {
      const parsed = sessionSummarySchema.safeParse(JSON.parse(content));
      if (parsed.success) {
        summary = parsed.data;
      }
    }
  }

  await supabase.from("session_summaries").delete().eq("conversation_id", conversationId);

  const { data, error } = await supabase
    .from("session_summaries")
    .insert({
      user_id: userId,
      conversation_id: conversationId,
      main_issue: summary.main_issue,
      emotional_state: summary.emotional_state,
      possible_triggers: summary.possible_triggers,
      suggested_focus_area: summary.suggested_focus_area,
      emotional_themes: summary.emotional_themes,
      recurring_issues: summary.recurring_issues,
      suggested_next_steps: summary.suggested_next_steps,
      summary_text: summary.summary_text
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await upsertAccountMemory(supabase, userId, {
    displayName,
    emotionalThemes: summary.emotional_themes,
    recurringIssues: summary.recurring_issues,
    commonTriggers: summary.possible_triggers,
    memorySnippet: summary.summary_text,
    lastSessionSummary: summary.summary_text,
    lastDetectedEmotion: summary.emotional_state
  });

  return data;
}
