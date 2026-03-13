import { NextResponse } from "next/server";
import { insightsPrompt } from "@/lib/ai/prompts";
import { insightBatchSchema } from "@/lib/ai/schemas";
import { getOpenAIClient } from "@/lib/openai";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  const [moodResponse, journalResponse] = await Promise.all([
    supabase.from("mood_logs").select("created_at,mood,anxiety_level,stress,notes").eq("user_id", user.id).limit(14),
    supabase.from("journal_entries").select("created_at,text_content,emotional_analysis_json").eq("user_id", user.id).limit(14)
  ]);

  const client = getOpenAIClient();
  const fallbackInsights = [
    {
      insight_type: "progress",
      description: "Generate insights after connecting OpenAI and adding more mood or journal data."
    }
  ];

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
            journalEntries: journalResponse.data ?? []
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
