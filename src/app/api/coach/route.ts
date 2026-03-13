import { NextResponse } from "next/server";
import { z } from "zod";
import { coachResponseSchema } from "@/lib/ai/schemas";
import { coachSystemPrompt } from "@/lib/ai/prompts";
import { getOpenAIClient } from "@/lib/openai";
import { detectCrisisLanguage } from "@/lib/safety";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  message: z.string().min(1),
  crisisFlag: z.boolean().optional().default(false),
  conversationId: z.string().uuid().nullable().optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const payload = requestSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const highRisk = payload.data.crisisFlag || detectCrisisLanguage(payload.data.message);
  const client = getOpenAIClient();

  if (!client) {
    return NextResponse.json({
      emotion_validation: "It sounds like a lot is landing on you at once.",
      thinking_pattern: "This may include catastrophizing or trying to predict the future with certainty.",
      reframe: "A hard moment does not automatically mean a bad outcome. What is one more balanced possibility?",
      exercise: "Take five slow breaths with a longer exhale than inhale.",
      reflection_question: "What evidence supports your worry, and what evidence points to a less severe outcome?",
      risk_level: highRisk ? "high" : "low",
      show_crisis_resources: highRisk,
      conversationId: payload.data.conversationId ?? null
    });
  }

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: coachSystemPrompt },
      { role: "user", content: payload.data.message }
    ]
  });

  const content = completion.choices[0]?.message?.content;

  if (!content) {
    return NextResponse.json({ error: "Empty model response." }, { status: 502 });
  }

  const parsed = coachResponseSchema.safeParse(JSON.parse(content));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid structured response." }, { status: 502 });
  }

  if (highRisk) {
    parsed.data.risk_level = "high";
    parsed.data.show_crisis_resources = true;
  }

  let conversationId = payload.data.conversationId ?? null;

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (user) {
      if (!conversationId) {
        const { data: conversation } = await supabase
          .from("conversations")
          .insert({
            user_id: user.id,
            title: payload.data.message.slice(0, 80)
          })
          .select("id")
          .single();

        conversationId = conversation?.id ?? null;
      }

      if (conversationId) {
        await supabase.from("messages").insert([
          {
            conversation_id: conversationId,
            role: "user",
            content: payload.data.message
          },
          {
            conversation_id: conversationId,
            role: "assistant",
            content: parsed.data.emotion_validation,
            structured_json: parsed.data
          }
        ]);
      }
    }
  }

  return NextResponse.json({
    ...parsed.data,
    conversationId
  });
}
