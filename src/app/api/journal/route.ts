import { NextResponse } from "next/server";
import { z } from "zod";
import { journalAnalysisPrompt } from "@/lib/ai/prompts";
import { journalAnalysisSchema } from "@/lib/ai/schemas";
import { getOpenAIClient } from "@/lib/openai";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const journalSchema = z.object({
  textContent: z.string().min(1)
});

export async function POST(request: Request) {
  const body = await request.json();
  const payload = journalSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid journal entry." }, { status: 400 });
  }

  const client = getOpenAIClient();
  let emotionalAnalysis: z.infer<typeof journalAnalysisSchema> = {
    emotionalThemes: ["reflection"],
    triggers: [],
    distortions: [],
    tone: "thoughtful",
    summary: "Your entry has been saved. Add OpenAI credentials to enable richer analysis."
  };

  if (client) {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: journalAnalysisPrompt },
        { role: "user", content: payload.data.textContent }
      ]
    });

    const content = completion.choices[0]?.message?.content;
    if (content) {
      const parsed = journalAnalysisSchema.safeParse(JSON.parse(content));
      if (parsed.success) {
        emotionalAnalysis = parsed.data;
      }
    }
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({
      ok: true,
      entry: {
        id: crypto.randomUUID(),
        textContent: payload.data.textContent,
        emotionalAnalysis,
        createdAt: new Date().toISOString()
      }
    });
  }

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("journal_entries")
    .insert({
      user_id: user.id,
      text_content: payload.data.textContent,
      emotional_analysis_json: emotionalAnalysis
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    entry: {
      id: data.id,
      textContent: data.text_content,
      emotionalAnalysis: data.emotional_analysis_json,
      createdAt: data.created_at
    }
  });
}
