import { NextResponse } from "next/server";
import { insightsPrompt } from "@/lib/ai/prompts";
import { insightBatchSchema } from "@/lib/ai/schemas";
import { generatePatternInsights } from "@/lib/insight-engine";
import { getOpenAIClient } from "@/lib/openai";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasProAccess } from "@/lib/data";
import { refreshAITwinProfileFromAccount } from "@/lib/ai-twin";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(new URL("/insights", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return NextResponse.redirect(new URL("/auth", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan,status,current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!subscription || !hasProAccess({ plan: subscription.plan ?? "free", status: subscription.status ?? "inactive", currentPeriodEnd: subscription.current_period_end })) {
    return NextResponse.redirect(new URL("/upgrade", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }

  const [moodResponse, journalResponse, sessionSummaryResponse, accountMemoryResponse, aiTwinProfile] = await Promise.all([
    supabase.from("mood_logs").select("created_at,mood,anxiety_level,stress,notes").eq("user_id", user.id).limit(14),
    supabase.from("journal_entries").select("created_at,text_content,emotional_analysis_json").eq("user_id", user.id).limit(14),
    supabase
      .from("session_summaries")
      .select("conversation_id,main_issue,emotional_state,possible_triggers,suggested_focus_area,emotional_themes,recurring_issues,suggested_next_steps,summary_text,created_at,id")
      .eq("user_id", user.id)
      .limit(5),
    supabase.from("account_memory").select("*").eq("user_id", user.id).maybeSingle(),
    refreshAITwinProfileFromAccount({ supabase, userId: user.id })
  ]);

  const client = getOpenAIClient();
  const fallbackInsights = generatePatternInsights({
    moodLogs: (moodResponse.data ?? []).map((row, index) => ({
      id: `mood-${index}`,
      mood: row.mood,
      anxietyLevel: row.anxiety_level,
      energy: 5,
      stress: row.stress,
      sleepQuality: 5,
      notes: row.notes,
      createdAt: row.created_at
    })),
    journalEntries: (journalResponse.data ?? []).map((row, index) => ({
      id: `journal-${index}`,
      textContent: row.text_content,
      voiceUrl: null,
      emotionalAnalysis: row.emotional_analysis_json,
      createdAt: row.created_at
    })),
    sessionSummaries: (sessionSummaryResponse.data ?? []).map((row) => ({
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
    })),
    accountMemory: accountMemoryResponse.data
      ? {
          userId: accountMemoryResponse.data.user_id,
          displayName: accountMemoryResponse.data.display_name ?? "",
          bringsYouHere: accountMemoryResponse.data.brings_you_here ?? [],
          therapistStyle: accountMemoryResponse.data.therapist_style ?? "Practical Coach",
          goals: accountMemoryResponse.data.goals ?? [],
          emotionalThemes: accountMemoryResponse.data.emotional_themes ?? [],
          recurringIssues: accountMemoryResponse.data.recurring_issues ?? [],
          commonTriggers: accountMemoryResponse.data.common_triggers ?? [],
          memorySummary: accountMemoryResponse.data.memory_summary ?? "",
          lastSessionSummary: accountMemoryResponse.data.last_session_summary ?? "",
          lastDetectedEmotion: accountMemoryResponse.data.last_detected_emotion ?? null,
          lastMood: accountMemoryResponse.data.last_mood ?? null,
          lastAnxietyLevel: accountMemoryResponse.data.last_anxiety_level ?? null,
          lastStressLevel: accountMemoryResponse.data.last_stress_level ?? null,
          lastSleepQuality: accountMemoryResponse.data.last_sleep_quality ?? null,
          updatedAt: accountMemoryResponse.data.updated_at
        }
      : null
    ,
    aiTwinProfile
  }).map((insight) => ({
    insight_type: insight.insightType,
    description: insight.description
  }));

  let generated = fallbackInsights;

  if (client) {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: insightsPrompt },
        {
          role: "user",
          content: JSON.stringify({
            moodLogs: moodResponse.data ?? [],
            journalEntries: journalResponse.data ?? [],
            sessionSummaries: sessionSummaryResponse.data ?? [],
            accountMemory: accountMemoryResponse.data ?? null,
            aiTwinProfile
          })
        }
      ]
    });

    const content = completion.choices[0]?.message?.content;
    if (content) {
      const parsed = insightBatchSchema.safeParse(JSON.parse(content));
      if (parsed.success) {
        generated = parsed.data.insights;
      }
    }
  }

  await supabase.from("insights").delete().eq("user_id", user.id);
  await supabase.from("insights").insert(
    generated.map((insight) => ({
      user_id: user.id,
      insight_type: insight.insight_type,
      description: insight.description
    }))
  );

  return NextResponse.redirect(new URL("/insights", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}
